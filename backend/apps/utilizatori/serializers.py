from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied


class UserAccountSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    first_name = serializers.CharField(read_only=True)
    last_name = serializers.CharField(read_only=True)
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField(allow_blank=True, read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    is_staff = serializers.BooleanField(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)
    date_joined = serializers.DateTimeField(read_only=True)
    last_login = serializers.DateTimeField(allow_null=True, read_only=True)

    class Meta:
        model = get_user_model()
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "is_active",
            "is_staff",
            "is_superuser",
            "date_joined",
            "last_login",
        )

    def get_full_name(self, obj) -> str:
        return obj.get_full_name().strip() or obj.get_username()


class UserQuerySerializer(serializers.Serializer):
    search = serializers.CharField(allow_blank=True, max_length=150, required=False)
    status = serializers.ChoiceField(
        choices=("all", "active", "inactive"),
        default="all",
        required=False,
    )
    role = serializers.ChoiceField(
        choices=("all", "staff", "user"),
        default="all",
        required=False,
    )


class UserWriteSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        allow_blank=True,
        required=False,
        trim_whitespace=False,
        write_only=True,
    )

    class Meta:
        model = get_user_model()
        fields = (
            "username",
            "first_name",
            "last_name",
            "email",
            "password",
            "is_active",
            "is_staff",
        )
        extra_kwargs = {
            "email": {"allow_blank": True, "required": False},
            "first_name": {"allow_blank": True, "required": False},
            "is_active": {"required": False},
            "is_staff": {"required": False},
            "last_name": {"allow_blank": True, "required": False},
        }

    def validate_username(self, value: str) -> str:
        username = value.strip()
        queryset = get_user_model().objects.filter(username__iexact=username)
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("Există deja un utilizator cu acest nume.")
        return username

    def validate_email(self, value: str) -> str:
        return get_user_model().objects.normalize_email(value.strip())

    def validate_password(self, value: str) -> str:
        if not value:
            return value

        user = self.instance or get_user_model()()
        try:
            validate_password(value, user=user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages) from exc
        return value

    def validate(self, attrs):
        request = self.context["request"]
        target = self.instance
        requested_staff = attrs.get("is_staff")

        if target is None and not attrs.get("password"):
            raise serializers.ValidationError({"password": "Parola este obligatorie."})

        if requested_staff is not None and requested_staff != getattr(target, "is_staff", False):
            if not request.user.is_superuser:
                raise PermissionDenied(
                    "Doar un superutilizator poate acorda sau retrage accesul de administrator."
                )

        if (
            target is not None
            and target.is_staff
            and target.pk != request.user.pk
            and not request.user.is_superuser
        ):
            raise PermissionDenied(
                "Doar un superutilizator poate modifica un alt cont administrativ."
            )

        if target is not None and target.is_superuser and requested_staff is False:
            raise serializers.ValidationError(
                {"is_staff": "Un superutilizator trebuie să rămână administrator."}
            )

        if target is not None and target.pk == request.user.pk:
            if attrs.get("is_active") is False:
                raise serializers.ValidationError(
                    {"is_active": "Nu îți poți dezactiva propriul cont."}
                )
            if attrs.get("is_staff") is False:
                raise serializers.ValidationError(
                    {"is_staff": "Nu îți poți retrage propriul acces administrativ."}
                )

        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = get_user_model()(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", "")
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class UserListResponseSerializer(serializers.Serializer):
    count = serializers.IntegerField(min_value=0)
    next = serializers.CharField(allow_null=True)
    previous = serializers.CharField(allow_null=True)
    results = UserAccountSerializer(many=True)

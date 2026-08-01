from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied


class GroupSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()


class ApplicationAccessSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    key = serializers.CharField()
    name = serializers.CharField()


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
    groups = serializers.SerializerMethodField()
    direct_applications = serializers.SerializerMethodField()
    inherited_applications = serializers.SerializerMethodField()
    effective_applications = serializers.SerializerMethodField()

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
            "groups",
            "direct_applications",
            "inherited_applications",
            "effective_applications",
        )

    def get_full_name(self, obj) -> str:
        return obj.get_full_name().strip() or obj.get_username()

    @extend_schema_field(GroupSummarySerializer(many=True))
    def get_groups(self, obj) -> list[dict[str, object]]:
        return [{"id": group.id, "name": group.name} for group in obj.groups.all()]

    @staticmethod
    def serialize_applications(applications):
        return [
            {"id": application.id, "key": application.key, "name": application.name}
            for application in applications
        ]

    @extend_schema_field(ApplicationAccessSerializer(many=True))
    def get_direct_applications(self, obj):
        return self.serialize_applications(obj.directly_allowed_applications.all())

    @extend_schema_field(ApplicationAccessSerializer(many=True))
    def get_inherited_applications(self, obj):
        inherited = self.context.get("inherited_applications")
        if inherited is not None:
            return self.serialize_applications(inherited.get(obj.pk, []))
        from apps.core.models import ApplicationDefinition

        applications = ApplicationDefinition.objects.filter(
            is_enabled=True,
            is_access_controlled=True,
            allowed_groups__user=obj,
        ).distinct()
        return self.serialize_applications(applications)

    @extend_schema_field(ApplicationAccessSerializer(many=True))
    def get_effective_applications(self, obj):
        effective = self.context.get("effective_applications")
        if effective is not None:
            return self.serialize_applications(effective.get(obj.pk, []))
        from apps.core.models import ApplicationDefinition
        from apps.core.services import get_user_accessible_application_keys

        application_keys = get_user_accessible_application_keys(obj)
        applications = ApplicationDefinition.objects.filter(key__in=application_keys)
        if not obj.is_superuser:
            applications = applications.filter(is_access_controlled=True)
        return self.serialize_applications(applications)


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
    group = serializers.IntegerField(min_value=1, required=False)


class UserWriteSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        allow_blank=True,
        required=False,
        trim_whitespace=False,
        write_only=True,
    )
    group_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=False,
        write_only=True,
    )
    direct_application_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=False,
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
            "group_ids",
            "direct_application_ids",
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

        if target is not None and target.is_superuser and "direct_application_ids" in attrs:
            raise serializers.ValidationError(
                {
                    "direct_application_ids": (
                        "Accesul direct nu poate fi modificat pentru un superutilizator; "
                        "acesta are acces complet la toate aplicațiile active."
                    )
                }
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

        if "group_ids" in attrs:
            group_ids = list(dict.fromkeys(attrs["group_ids"]))
            groups = list(Group.objects.filter(pk__in=group_ids))
            if len(groups) != len(group_ids):
                raise serializers.ValidationError(
                    {"group_ids": "Unul sau mai multe grupuri nu există."}
                )
            attrs["group_ids"] = group_ids

        if "direct_application_ids" in attrs:
            from apps.core.models import ApplicationDefinition

            application_ids = list(dict.fromkeys(attrs["direct_application_ids"]))
            applications = ApplicationDefinition.objects.filter(
                pk__in=application_ids,
                is_enabled=True,
                is_access_controlled=True,
                is_assignable=True,
            )
            if applications.count() != len(application_ids):
                raise serializers.ValidationError(
                    {
                        "direct_application_ids": (
                            "Aplicațiile trebuie să existe, să fie active și să necesite "
                            "control de acces."
                        )
                    }
                )
            attrs["direct_application_ids"] = application_ids

        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        group_ids = validated_data.pop("group_ids", [])
        direct_application_ids = validated_data.pop("direct_application_ids", [])
        user = get_user_model()(**validated_data)
        user.set_password(password)
        user.save()
        user.groups.set(group_ids)
        user.directly_allowed_applications.set(direct_application_ids)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", "")
        group_ids = validated_data.pop("group_ids", None)
        direct_application_ids = validated_data.pop("direct_application_ids", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if password:
            instance.set_password(password)
        instance.save()
        if group_ids is not None:
            instance.groups.set(group_ids)
        if direct_application_ids is not None:
            instance.directly_allowed_applications.set(direct_application_ids)
        return instance


class GroupApplicationSerializer(ApplicationAccessSerializer):
    pass


class AvailableApplicationSerializer(GroupApplicationSerializer):
    pass


class GroupUserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    full_name = serializers.CharField()
    is_active = serializers.BooleanField()


class UserSelectionSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = get_user_model()
        fields = ("id", "username", "full_name", "email", "is_active")

    def get_full_name(self, obj) -> str:
        return obj.get_full_name().strip() or obj.get_username()


class UserSelectionQuerySerializer(serializers.Serializer):
    search = serializers.CharField(allow_blank=True, max_length=150, required=False)
    page = serializers.IntegerField(min_value=1, required=False)
    page_size = serializers.IntegerField(min_value=1, max_value=50, required=False)


class UserSelectionListResponseSerializer(serializers.Serializer):
    count = serializers.IntegerField(min_value=0)
    next = serializers.CharField(allow_null=True)
    previous = serializers.CharField(allow_null=True)
    results = UserSelectionSerializer(many=True)


class ApplicationGroupSerializer(serializers.ModelSerializer):
    applications = serializers.SerializerMethodField()
    users = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ("id", "name", "applications", "users")

    @extend_schema_field(GroupApplicationSerializer(many=True))
    def get_applications(self, group):
        applications = group.allowed_applications.all()
        return [
            {"id": application.id, "key": application.key, "name": application.name}
            for application in applications
        ]

    @extend_schema_field(GroupUserSerializer(many=True))
    def get_users(self, group):
        return [
            {
                "id": user.id,
                "username": user.username,
                "full_name": user.get_full_name().strip() or user.get_username(),
                "is_active": user.is_active,
            }
            for user in group.user_set.all()
        ]


class ApplicationGroupWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150, trim_whitespace=True)
    application_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1), required=False, default=list
    )
    user_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1), required=False, default=list
    )

    def validate_name(self, value: str) -> str:
        name = value.strip()
        if not name:
            raise serializers.ValidationError("Numele grupului este obligatoriu.")
        queryset = Group.objects.filter(name__iexact=name)
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("Există deja un grup cu acest nume.")
        return name

    def validate(self, attrs):
        from apps.core.models import ApplicationDefinition

        if "application_ids" in attrs:
            application_ids = list(dict.fromkeys(attrs["application_ids"]))
            applications = list(
                ApplicationDefinition.objects.filter(
                    pk__in=application_ids,
                    is_enabled=True,
                    is_access_controlled=True,
                    is_assignable=True,
                )
            )
            if len(applications) != len(application_ids):
                raise serializers.ValidationError(
                    {
                        "application_ids": (
                            "Aplicațiile trebuie să existe, să fie active și să necesite "
                            "control de acces."
                        )
                    }
                )
            attrs["application_ids"] = application_ids
        if "user_ids" in attrs:
            user_ids = list(dict.fromkeys(attrs["user_ids"]))
            users = list(get_user_model().objects.filter(pk__in=user_ids))
            if len(users) != len(user_ids):
                raise serializers.ValidationError(
                    {"user_ids": "Unul sau mai mulți utilizatori nu există."}
                )
            attrs["user_ids"] = user_ids
        return attrs


class UserListResponseSerializer(serializers.Serializer):
    count = serializers.IntegerField(min_value=0)
    next = serializers.CharField(allow_null=True)
    previous = serializers.CharField(allow_null=True)
    results = UserAccountSerializer(many=True)

from django.db import migrations


def remove_legacy_course_planner_permission(apps, schema_editor):
    ContentType = apps.get_model("contenttypes", "ContentType")
    Permission = apps.get_model("auth", "Permission")
    content_types = ContentType.objects.filter(
        app_label="course_planner", model="courseplannersettings"
    )
    Permission.objects.filter(
        content_type__in=content_types, codename="use_course_planner"
    ).delete()


class Migration(migrations.Migration):
    dependencies = [("course_planner", "0002_courseplangeneration")]

    operations = [
        migrations.AlterModelOptions(
            name="courseplannersettings",
            options={
                "verbose_name": "setări planificator cursuri",
                "verbose_name_plural": "setări planificator cursuri",
            },
        ),
        migrations.RunPython(remove_legacy_course_planner_permission, migrations.RunPython.noop),
    ]

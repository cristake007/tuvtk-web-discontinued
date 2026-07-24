import re
from xml.etree import ElementTree

from django.core.exceptions import ValidationError

MAX_SVG_LOGO_BYTES = 256 * 1024
SVG_NAMESPACE = "http://www.w3.org/2000/svg"
XLINK_NAMESPACE = "http://www.w3.org/1999/xlink"

DANGEROUS_ELEMENTS = {
    "animate",
    "animatemotion",
    "animatetransform",
    "audio",
    "embed",
    "foreignobject",
    "iframe",
    "object",
    "script",
    "set",
    "video",
}
DANGEROUS_CSS_TOKENS = (
    "@import",
    "expression(",
    "javascript:",
)
URL_ATTRIBUTES = {
    "href",
    "src",
    f"{{{XLINK_NAMESPACE}}}href",
}
URL_FUNCTION_PATTERN = re.compile(r"url\(([^)]*)\)", re.IGNORECASE)


def _local_name(name: str) -> str:
    return name.rsplit("}", 1)[-1].lower()


def _validate_css(value: str) -> None:
    normalized = value.replace("\x00", "").lower()
    if any(token in normalized for token in DANGEROUS_CSS_TOKENS):
        raise ValidationError("The SVG contains unsafe CSS.")

    for match in URL_FUNCTION_PATTERN.finditer(normalized):
        target = match.group(1).strip().strip("\"'")
        if not target.startswith("#"):
            raise ValidationError("External SVG resource links are not allowed.")


def sanitize_svg_logo(svg_bytes: bytes) -> str:
    if not svg_bytes:
        raise ValidationError("The SVG file is empty.")

    if len(svg_bytes) > MAX_SVG_LOGO_BYTES:
        raise ValidationError("The SVG file must be 256 KB or smaller.")

    try:
        svg_text = svg_bytes.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise ValidationError("The SVG file must use UTF-8 encoding.") from exc

    lowered_source = svg_text.lower()
    if "<!doctype" in lowered_source or "<!entity" in lowered_source:
        raise ValidationError("DOCTYPE and entity declarations are not allowed.")

    try:
        root = ElementTree.fromstring(svg_text)
    except ElementTree.ParseError as exc:
        raise ValidationError("The uploaded file is not valid SVG XML.") from exc

    if _local_name(root.tag) != "svg":
        raise ValidationError("The uploaded file must have an SVG root element.")

    for element in root.iter():
        element_name = _local_name(element.tag)
        if element_name in DANGEROUS_ELEMENTS:
            raise ValidationError(
                f"The SVG element '{element_name}' is not allowed."
            )

        if element_name == "style" and element.text:
            _validate_css(element.text)

        for attribute_name, attribute_value in element.attrib.items():
            local_attribute_name = _local_name(attribute_name)
            normalized_value = attribute_value.strip()

            if local_attribute_name.startswith("on"):
                raise ValidationError("SVG event handler attributes are not allowed.")

            if attribute_name in URL_ATTRIBUTES or local_attribute_name in URL_ATTRIBUTES:
                if normalized_value and not normalized_value.startswith("#"):
                    raise ValidationError("External SVG resource links are not allowed.")

            if "javascript:" in normalized_value.lower():
                raise ValidationError("JavaScript URLs are not allowed in SVG files.")

            if "url(" in normalized_value.lower():
                _validate_css(normalized_value)

            if local_attribute_name == "style":
                _validate_css(normalized_value)

    ElementTree.register_namespace("", SVG_NAMESPACE)
    return ElementTree.tostring(root, encoding="unicode", short_empty_elements=True)

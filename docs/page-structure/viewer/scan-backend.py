#!/usr/bin/env python3
"""Static Django/DRF architecture scanner used by refresh-data.mjs.

Uses only Python's standard library, prints one JSON document to stdout and
never imports or executes the Django project.
"""

from __future__ import annotations

import ast
import hashlib
import json
import re
import sys
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[3]
BACKEND = ROOT / "backend"
APPS_ROOT = BACKEND / "apps"

HTTP_METHODS = ("get", "post", "put", "patch", "delete", "head", "options")
STATUS_CODES = {
    "HTTP_200_OK": 200,
    "HTTP_201_CREATED": 201,
    "HTTP_202_ACCEPTED": 202,
    "HTTP_204_NO_CONTENT": 204,
    "HTTP_400_BAD_REQUEST": 400,
    "HTTP_401_UNAUTHORIZED": 401,
    "HTTP_403_FORBIDDEN": 403,
    "HTTP_404_NOT_FOUND": 404,
    "HTTP_409_CONFLICT": 409,
    "HTTP_429_TOO_MANY_REQUESTS": 429,
    "HTTP_500_INTERNAL_SERVER_ERROR": 500,
    "HTTP_502_BAD_GATEWAY": 502,
    "HTTP_503_SERVICE_UNAVAILABLE": 503,
}


def posix(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def module_for(path: Path) -> str:
    return path.relative_to(BACKEND).with_suffix("").as_posix().replace("/", ".")


def safe_unparse(node: ast.AST | None) -> str:
    if node is None:
        return ""
    try:
        return ast.unparse(node)
    except Exception:
        return node.__class__.__name__


def dotted_name(node: ast.AST | None) -> str:
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        base = dotted_name(node.value)
        return f"{base}.{node.attr}" if base else node.attr
    if isinstance(node, ast.Call):
        return dotted_name(node.func)
    return safe_unparse(node)


def literal_string(node: ast.AST | None) -> str | None:
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        return node.value
    return None


def literal_list(node: ast.AST | None) -> list[str]:
    if isinstance(node, (ast.List, ast.Tuple, ast.Set)):
        return [dotted_name(item).split(".")[-1] for item in node.elts]
    return []


def class_assignments(node: ast.ClassDef) -> dict[str, ast.AST]:
    result: dict[str, ast.AST] = {}
    for item in node.body:
        if isinstance(item, (ast.Assign, ast.AnnAssign)):
            targets = item.targets if isinstance(item, ast.Assign) else [item.target]
            value = item.value
            for target in targets:
                if isinstance(target, ast.Name) and value is not None:
                    result[target.id] = value
    return result


def imported_symbols(tree: ast.Module, module_name: str) -> dict[str, dict[str, str]]:
    symbols: dict[str, dict[str, str]] = {}
    package = module_name.split(".")[:-1]
    for node in tree.body:
        if isinstance(node, ast.ImportFrom):
            if node.level:
                base = package[: len(package) - node.level + 1]
                target_module = ".".join([*base, *(node.module or "").split(".")]).strip(".")
            else:
                target_module = node.module or ""
            for alias in node.names:
                local = alias.asname or alias.name
                symbols[local] = {"module": target_module, "name": alias.name}
        elif isinstance(node, ast.Import):
            for alias in node.names:
                local = alias.asname or alias.name.split(".")[0]
                symbols[local] = {"module": alias.name, "name": alias.name.split(".")[-1]}
    return symbols


def calls_in(node: ast.AST) -> list[str]:
    return [dotted_name(call.func) for call in ast.walk(node) if isinstance(call, ast.Call)]


def names_in(node: ast.AST) -> set[str]:
    return {item.id for item in ast.walk(node) if isinstance(item, ast.Name)}


def decorator_named(node: ast.FunctionDef | ast.AsyncFunctionDef, name: str) -> ast.Call | None:
    for decorator in node.decorator_list:
        if isinstance(decorator, ast.Call) and dotted_name(decorator.func).split(".")[-1] == name:
            return decorator
    return None


def keyword_value(call: ast.Call | None, name: str) -> ast.AST | None:
    if call is None:
        return None
    return next((keyword.value for keyword in call.keywords if keyword.arg == name), None)


def response_contract(expression: ast.AST | None) -> tuple[list[int], list[str], list[str]]:
    codes: list[int] = []
    success: list[str] = []
    errors: list[str] = []
    if isinstance(expression, ast.Dict):
        for key, value in zip(expression.keys, expression.values):
            key_name = dotted_name(key).split(".")[-1]
            code: int | None = None
            if isinstance(key, ast.Constant) and isinstance(key.value, int):
                code = key.value
            elif isinstance(key, ast.Tuple) and key.elts:
                first = key.elts[0]
                if isinstance(first, ast.Constant) and isinstance(first.value, int):
                    code = first.value
                else:
                    code = STATUS_CODES.get(dotted_name(first).split(".")[-1])
            elif key_name in STATUS_CODES:
                code = STATUS_CODES[key_name]
            serializer = dotted_name(value).replace(".many", "") or safe_unparse(value)
            if code is not None:
                codes.append(code)
                target = success if 200 <= code < 400 else errors
                if serializer not in {"None", "NoneType", ""}:
                    target.append(serializer)
    elif expression is not None:
        serializer = dotted_name(expression) or safe_unparse(expression)
        success.append(serializer)
        codes.append(200)
    return sorted(set(codes)), sorted(set(success)), sorted(set(errors))


def status_codes_in(node: ast.AST) -> list[int]:
    codes: set[int] = set()
    for item in ast.walk(node):
        if isinstance(item, ast.Attribute) and item.attr in STATUS_CODES:
            codes.add(STATUS_CODES[item.attr])
        elif isinstance(item, ast.keyword) and item.arg == "status":
            name = dotted_name(item.value).split(".")[-1]
            if name in STATUS_CODES:
                codes.add(STATUS_CODES[name])
            elif isinstance(item.value, ast.Constant) and isinstance(item.value.value, int):
                codes.add(item.value.value)
    return sorted(codes)


def normalize_url_path(value: str) -> str:
    value = re.sub(r"<(?:[^:>]+:)?([^>]+)>", r"{\1}", value)
    value = re.sub(r"/+", "/", f"/{value}")
    return value if value == "/" or not value.endswith("//") else value[:-1]


def join_url(prefix: str, suffix: str) -> str:
    return normalize_url_path(prefix.strip("/") + "/" + suffix.lstrip("/"))


def endpoint_category(path: str, method: str, view: str) -> str:
    value = f"{path} {view}".lower()
    if any(token in value for token in ("auth", "bootstrap", "session", "csrf", "login", "logout")):
        return "auth/bootstrap"
    if any(token in value for token in ("schema", "docs", "redoc")):
        return "administrare"
    if "health" in value:
        return "posibil API public"
    if any(token in value for token in ("download", "file", "export", "upload", "format-xml")):
        return "upload/download"
    if "administration" in value or "utilizatori" in value or "group" in value:
        return "administrare"
    if any(token in value for token in ("sync", "wordpress", "connect", "preview", "generate", "update-row", "resolve")):
        return "workflow/comandă"
    if method in {"POST", "PUT", "PATCH", "DELETE"} or any(token in view.lower() for token in ("list", "detail", "collection")):
        return "CRUD"
    return "endpoint intern pentru frontend"


@dataclass
class ParsedFile:
    path: Path
    module: str
    source: str
    tree: ast.Module
    imports: dict[str, dict[str, str]]


def read_python_files() -> dict[str, ParsedFile]:
    parsed: dict[str, ParsedFile] = {}
    for path in sorted(BACKEND.rglob("*.py")):
        relative_path = path.relative_to(BACKEND).as_posix()
        if "/migrations/" in f"/{relative_path}" or "__pycache__" in relative_path:
            continue
        source = path.read_text(encoding="utf-8")
        try:
            tree = ast.parse(source, filename=str(path))
        except SyntaxError as exc:
            print(f"Nu se poate parsa {path}: {exc}", file=sys.stderr)
            continue
        module = module_for(path)
        parsed[module] = ParsedFile(path, module, source, tree, imported_symbols(tree, module))
    return parsed


def installed_apps(settings_source: str) -> list[str]:
    return re.findall(r'"apps\.([a-zA-Z0-9_]+)\.apps\.[A-Za-z0-9_]+"', settings_source)


def entity_source(file: ParsedFile, node: ast.AST) -> dict[str, Any]:
    return {
        "file": posix(file.path),
        "line": getattr(node, "lineno", 1),
        "endLine": getattr(node, "end_lineno", getattr(node, "lineno", 1)),
        "lines": getattr(node, "end_lineno", getattr(node, "lineno", 1)) - getattr(node, "lineno", 1) + 1,
    }


def scan_models(file: ParsedFile, app: str) -> list[dict[str, Any]]:
    models: list[dict[str, Any]] = []
    for node in file.tree.body:
        if not isinstance(node, ast.ClassDef) or not any(dotted_name(base).endswith("Model") for base in node.bases):
            continue
        fields: list[dict[str, Any]] = []
        relations: list[dict[str, Any]] = []
        for item in node.body:
            if not isinstance(item, (ast.Assign, ast.AnnAssign)) or not isinstance(item.value, ast.Call):
                continue
            targets = item.targets if isinstance(item, ast.Assign) else [item.target]
            target = next((entry.id for entry in targets if isinstance(entry, ast.Name)), None)
            field_type = dotted_name(item.value.func).split(".")[-1]
            if not target or (not field_type.endswith("Field") and field_type != "ForeignKey"):
                continue
            field = {"name": target, "type": field_type, "line": item.lineno}
            fields.append(field)
            if field_type in {"ForeignKey", "OneToOneField", "ManyToManyField"} and item.value.args:
                raw_target = literal_string(item.value.args[0]) or dotted_name(item.value.args[0])
                imported_target = file.imports.get(raw_target)
                if raw_target == "self":
                    target_model = f"{app}.{node.name}"
                elif imported_target and imported_target["module"] == "django.contrib.auth.models":
                    target_model = f"auth.{imported_target['name']}"
                elif imported_target and imported_target["module"].startswith("apps.") and imported_target["module"].endswith(".models"):
                    target_app = imported_target["module"].removeprefix("apps.").removesuffix(".models")
                    target_model = f"{target_app}.{imported_target['name']}"
                else:
                    target_model = raw_target if "." in raw_target else f"{app}.{raw_target}"
                relation = {"field": target, "type": field_type, "target": target_model, "line": item.lineno}
                relations.append(relation)
        models.append({
            "name": node.name,
            **entity_source(file, node),
            "fields": fields,
            "relations": relations,
            "methods": [item.name for item in node.body if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef))],
        })
    return models


def scan_named_classes(file: ParsedFile, suffix: str) -> list[dict[str, Any]]:
    result = []
    for node in file.tree.body:
        if not isinstance(node, ast.ClassDef):
            continue
        bases = [dotted_name(base).split(".")[-1] for base in node.bases]
        if suffix not in node.name and not any(suffix in base for base in bases):
            continue
        class_names = names_in(node)
        model_refs = []
        for local, imported in file.imports.items():
            if local not in class_names:
                continue
            if imported["module"] == "django.contrib.auth.models":
                model_refs.append(f"auth.{imported['name']}")
            elif imported["module"].startswith("apps.") and imported["module"].endswith(".models"):
                target_app = imported["module"].removeprefix("apps.").removesuffix(".models")
                model_refs.append(f"{target_app}.{imported['name']}")
        for child in ast.walk(node):
            if not isinstance(child, ast.ImportFrom) or not child.module:
                continue
            if child.module == "django.contrib.auth.models":
                model_refs.extend(f"auth.{alias.name}" for alias in child.names)
            elif child.module.startswith("apps.") and child.module.endswith(".models"):
                target_app = child.module.removeprefix("apps.").removesuffix(".models")
                model_refs.extend(f"{target_app}.{alias.name}" for alias in child.names)
        if "get_user_model" in class_names:
            model_refs.append("auth.User")
        methods = [
            item for item in node.body
            if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef))
        ]
        result.append({
            "name": node.name,
            "bases": bases,
            "methods": [item.name for item in methods],
            "methodMetrics": [
                {
                    "name": item.name,
                    "lines": item.end_lineno - item.lineno + 1,
                    "statements": sum(1 for child in ast.walk(item) if isinstance(child, ast.stmt)),
                    "objectAccesses": sum(
                        1 for child in ast.walk(item)
                        if isinstance(child, ast.Attribute) and child.attr == "objects"
                    ),
                }
                for item in methods
            ],
            "models": sorted(set(model_refs)),
            "objectAccessCount": sum(
                1 for item in ast.walk(node)
                if isinstance(item, ast.Attribute) and item.attr == "objects"
            ),
            **entity_source(file, node),
        })
    return result


def scan_functions(file: ParsedFile, public_only: bool = True) -> list[dict[str, Any]]:
    result = []
    local_functions = {
        item.name for item in file.tree.body
        if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef))
    }
    for node in file.tree.body:
        if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue
        if public_only and node.name.startswith("_"):
            continue
        normalized_calls = []
        models = []
        for call in calls_in(node):
            root = call.split(".")[0]
            imported = file.imports.get(root)
            if imported:
                normalized_calls.append(f"{imported['module']}.{imported['name']}")
            elif root in local_functions:
                normalized_calls.append(f"{file.module}.{root}")
            else:
                normalized_calls.append(call)
        for local, imported in file.imports.items():
            if local not in names_in(node):
                continue
            if imported["module"] == "django.contrib.auth.models":
                models.append(f"auth.{imported['name']}")
            elif imported["module"].startswith("apps.") and imported["module"].endswith(".models"):
                models.append(f"{imported['module'].removeprefix('apps.').removesuffix('.models')}.{imported['name']}")
        result.append({
            "name": node.name,
            **entity_source(file, node),
            "calls": sorted(set(normalized_calls)),
            "models": sorted(set(models)),
            "decorators": [dotted_name(item.func if isinstance(item, ast.Call) else item) for item in node.decorator_list],
        })
    return result


def scan_view_classes(file: ParsedFile, app: str, known_pagination: set[str]) -> list[dict[str, Any]]:
    views = []
    for node in file.tree.body:
        if not isinstance(node, ast.ClassDef):
            continue
        bases = [dotted_name(base).split(".")[-1] for base in node.bases]
        if not any("View" in base or "APIView" in base or "ViewSet" in base for base in bases):
            continue
        assignments = class_assignments(node)
        permissions = literal_list(assignments.get("permission_classes"))
        authentication = literal_list(assignments.get("authentication_classes"))
        throttle_classes = literal_list(assignments.get("throttle_classes"))
        filter_classes = literal_list(assignments.get("filter_backends"))
        if assignments.get("filterset_class"):
            filter_classes.append(dotted_name(assignments["filterset_class"]).split(".")[-1])
        methods = []
        for method_node in node.body:
            if not isinstance(method_node, (ast.FunctionDef, ast.AsyncFunctionDef)) or method_node.name.lower() not in HTTP_METHODS:
                continue
            schema = decorator_named(method_node, "extend_schema")
            request_expression = keyword_value(schema, "request")
            response_expression = keyword_value(schema, "responses")
            parameter_serializers = literal_list(keyword_value(schema, "parameters"))
            declared_codes, response_serializers, error_serializers = response_contract(response_expression)
            codes = sorted(set([*declared_codes, *status_codes_in(method_node)]))
            method_names = names_in(method_node)
            imported_service_calls: list[str] = []
            imported_task_calls: list[str] = []
            models: list[str] = []
            filters = [*filter_classes, *[f"query serializer: {name}" for name in parameter_serializers]]
            pagination: list[str] = []
            throttling = list(throttle_classes)
            for call in calls_in(method_node):
                root = call.split(".")[0]
                imported = file.imports.get(root)
                if imported and imported["module"].endswith(".services"):
                    imported_service_calls.append(f"{imported['module']}.{imported['name']}")
                if imported and imported["module"].endswith(".tasks"):
                    imported_task_calls.append(f"{imported['module']}.{imported['name']}")
                if root in known_pagination:
                    pagination.append(root)
                if root.endswith("Throttle"):
                    throttling.append(root)
                if "Filter" in root:
                    filters.append(root)
            for call in ast.walk(method_node):
                if not isinstance(call, ast.Call) or not call.args:
                    continue
                call_name = dotted_name(call.func)
                if call_name in {"request.query_params.get", "request.GET.get"}:
                    parameter = literal_string(call.args[0])
                    if parameter:
                        filters.append(f"query parameter: {parameter}")
            for local, imported in file.imports.items():
                if local not in method_names:
                    continue
                if imported["module"] == "django.contrib.auth.models":
                    models.append(f"auth.{imported['name']}")
                elif imported["module"].startswith("apps.") and imported["module"].endswith(".models"):
                    target_app = imported["module"].removeprefix("apps.").removesuffix(".models")
                    models.append(f"{target_app}.{imported['name']}")
            if "get_user_model" in method_names:
                models.append("auth.User")
            ordering = []
            for call in ast.walk(method_node):
                if isinstance(call, ast.Call) and dotted_name(call.func).endswith("order_by"):
                    ordering.extend(filter(None, (literal_string(arg) for arg in call.args)))
            serializer_names = [
                local for local in method_names
                if local.endswith("Serializer") and local in file.imports
            ]
            request_serializer = dotted_name(request_expression).split(".")[-1] if request_expression else None
            if request_serializer in {"None", ""}:
                request_serializer = None
            if not response_serializers and response_expression is None:
                response_serializers = sorted(set(serializer_names))
            methods.append({
                "method": method_node.name.upper(),
                "function": method_node.name,
                "requestSerializer": request_serializer,
                "parameterSerializers": parameter_serializers,
                "responseSerializers": response_serializers,
                "errorSerializers": error_serializers,
                "responseCodes": codes or [200],
                "services": sorted(set(imported_service_calls)),
                "tasks": sorted(set(imported_task_calls)),
                "models": sorted(set(models)),
                "filters": sorted(set(filters)),
                "ordering": sorted(set(ordering)),
                "pagination": sorted(set(pagination)),
                "throttling": sorted(set(throttling)),
                "line": method_node.lineno,
                "endLine": method_node.end_lineno,
                "lines": method_node.end_lineno - method_node.lineno + 1,
                "objectAccessCount": sum(1 for item in ast.walk(method_node) if isinstance(item, ast.Attribute) and item.attr == "objects"),
                "statementCount": sum(1 for item in ast.walk(method_node) if isinstance(item, ast.stmt)),
            })
        views.append({
            "name": node.name,
            "bases": bases,
            "permissions": permissions or ["IsAuthenticated (implicit global)"],
            "authentication": (
                ["None"] if "authentication_classes" in assignments and not authentication
                else authentication or ["BrowserSessionAuthentication (implicit global)"]
            ),
            "methods": methods,
            **entity_source(file, node),
        })
    return views


def scan_url_module(
    module_name: str,
    prefix: str,
    parsed: dict[str, ParsedFile],
    view_index: dict[str, dict[str, Any]],
    inherited_names: list[str] | None = None,
    visited: tuple[str, ...] = (),
) -> list[dict[str, Any]]:
    if module_name in visited or module_name not in parsed:
        return []
    file = parsed[module_name]
    app_name = next((literal_string(node.value) for node in file.tree.body if isinstance(node, ast.Assign) and any(isinstance(target, ast.Name) and target.id == "app_name" for target in node.targets)), None)
    patterns: list[ast.AST] = []
    for node in file.tree.body:
        if isinstance(node, ast.Assign) and any(isinstance(target, ast.Name) and target.id == "urlpatterns" for target in node.targets):
            if isinstance(node.value, ast.List):
                patterns.extend(node.value.elts)
    endpoints: list[dict[str, Any]] = []
    for call in patterns:
        if not isinstance(call, ast.Call) or dotted_name(call.func).split(".")[-1] not in {"path", "re_path"} or len(call.args) < 2:
            continue
        suffix = literal_string(call.args[0])
        if suffix is None:
            continue
        target = call.args[1]
        route_name = next((literal_string(keyword.value) for keyword in call.keywords if keyword.arg == "name"), None)
        full_path = join_url(prefix, suffix)
        if isinstance(target, ast.Call) and dotted_name(target.func).split(".")[-1] == "include":
            included = literal_string(target.args[0]) if target.args else None
            if included:
                endpoints.extend(scan_url_module(included, full_path, parsed, view_index, [*(inherited_names or []), *(filter(None, [app_name]))], (*visited, module_name)))
            continue
        view_name = ""
        if isinstance(target, ast.Call) and isinstance(target.func, ast.Attribute) and target.func.attr == "as_view":
            view_name = dotted_name(target.func.value).split(".")[-1]
        elif isinstance(target, ast.Name):
            view_name = target.id
        else:
            view_name = dotted_name(target)
        namespace = ":".join([*(inherited_names or []), *(filter(None, [app_name, route_name]))])
        view = view_index.get(view_name)
        if view:
            for method in view["methods"]:
                endpoints.append({
                    "method": method["method"],
                    "path": full_path,
                    "routeName": namespace or route_name,
                    "urlConfiguration": {"file": posix(file.path), "line": call.lineno},
                    "view": view_name,
                    "action": method["function"],
                    "viewType": view["bases"][0] if view["bases"] else "APIView",
                    "viewSource": {"file": view["file"], "line": method["line"]},
                    "app": view["app"],
                    "permissions": view["permissions"],
                    "authentication": view["authentication"],
                    **{key: method[key] for key in (
                        "requestSerializer", "parameterSerializers", "responseSerializers", "errorSerializers", "responseCodes",
                        "services", "tasks", "models", "filters", "ordering", "pagination", "throttling",
                    )},
                    "viewMetrics": {"lines": method["lines"], "statements": method["statementCount"], "objectAccesses": method["objectAccessCount"]},
                })
        else:
            imported = file.imports.get(view_name, {})
            external_module = imported.get("module", "")
            is_schema = "Spectacular" in view_name
            method = "GET"
            local_function = next(
                (
                    node for node in file.tree.body
                    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
                    and node.name == view_name
                ),
                None,
            )
            function_names = names_in(local_function) if local_function else set()
            function_services = []
            function_tasks = []
            function_models = []
            if local_function:
                for local, imported_symbol in file.imports.items():
                    if local not in function_names:
                        continue
                    imported_module = imported_symbol["module"]
                    qualified = f"{imported_module}.{imported_symbol['name']}"
                    if imported_module.endswith(".services"):
                        function_services.append(qualified)
                    elif imported_module.endswith(".tasks"):
                        function_tasks.append(qualified)
                    elif imported_module.endswith(".models"):
                        target_app = imported_module.removeprefix("apps.").removesuffix(".models")
                        function_models.append(f"{target_app}.{imported_symbol['name']}")
            endpoints.append({
                "method": method,
                "path": full_path,
                "routeName": namespace or route_name,
                "urlConfiguration": {"file": posix(file.path), "line": call.lineno},
                "view": view_name,
                "action": view_name if view_name and not view_name.endswith("View") else method.lower(),
                "viewType": "Django function view" if local_function else ("function" if view_name and not view_name.endswith("View") else "external APIView"),
                "viewSource": {"file": posix(file.path), "line": getattr(local_function or target, "lineno", call.lineno)},
                "app": "config" if module_name.startswith("config.") else module_name.split(".")[1],
                "permissions": ["AllowAny"] if view_name in {"authentication_root", "HealthView"} else (["IsAdminUser"] if is_schema else ["necunoscut static"]),
                "authentication": ["None"] if view_name in {"authentication_root", "HealthView"} else ["configurație DRF"],
                "requestSerializer": None,
                "parameterSerializers": [],
                "responseSerializers": ["OpenAPI schema"] if is_schema else [],
                "errorSerializers": [],
                "responseCodes": [200],
                "services": sorted(set(function_services)),
                "tasks": sorted(set(function_tasks)),
                "models": sorted(set(function_models)),
                "filters": [],
                "ordering": [],
                "pagination": [],
                "throttling": [],
                "externalImplementation": external_module or None,
            })
    return endpoints


def scan() -> dict[str, Any]:
    parsed = read_python_files()
    settings = parsed["config.settings"].source
    app_names = installed_apps(settings)
    applications: list[dict[str, Any]] = []
    view_index: dict[str, dict[str, Any]] = {}
    all_services: dict[str, dict[str, Any]] = {}
    dependency_edges: list[dict[str, Any]] = []
    model_edges: list[dict[str, Any]] = []
    all_findings: list[dict[str, Any]] = []

    pagination_names = {
        node.name
        for file in parsed.values()
        for node in file.tree.body
        if isinstance(node, ast.ClassDef) and any("Pagination" in dotted_name(base) for base in node.bases)
    }

    for app in app_names:
        prefix = f"apps.{app}"
        app_files = [file for module, file in parsed.items() if module == prefix or module.startswith(prefix + ".")]
        categories: dict[str, list[str]] = defaultdict(list)
        models: list[dict[str, Any]] = []
        serializers: list[dict[str, Any]] = []
        views: list[dict[str, Any]] = []
        services: list[dict[str, Any]] = []
        permissions: list[dict[str, Any]] = []
        authentication_classes: list[dict[str, Any]] = []
        throttles: list[dict[str, Any]] = []
        paginators: list[dict[str, Any]] = []
        validators: list[dict[str, Any]] = []
        filters: list[dict[str, Any]] = []
        selectors: list[dict[str, Any]] = []
        repositories: list[dict[str, Any]] = []
        tasks: list[dict[str, Any]] = []
        signals: list[dict[str, Any]] = []
        commands: list[dict[str, Any]] = []
        integrations: list[dict[str, Any]] = []
        tests: list[str] = []

        for file in app_files:
            relative_module = file.module.removeprefix(prefix).strip(".")
            filename = file.path.name
            source_path = posix(file.path)
            if filename.startswith("test") or "/tests/" in f"/{source_path}":
                tests.append(source_path)
                categories["tests"].append(source_path)
                continue
            category = (
                "commands" if "/management/commands/" in f"/{source_path}"
                else "models" if filename == "models.py"
                else "views" if filename == "views.py"
                else "serializers" if filename == "serializers.py"
                else "services" if filename == "services.py"
                else "tasks" if filename == "tasks.py"
                else "signals" if filename == "signals.py"
                else "permissions" if filename == "permissions.py"
                else "authentication" if filename == "authentication.py"
                else "throttling" if filename == "throttling.py"
                else "validators" if filename == "validators.py"
                else "filters" if filename == "filters.py"
                else "selectors" if filename == "selectors.py"
                else "repositories" if filename == "repositories.py"
                else "urls" if filename == "urls.py"
                else "other"
            )
            categories[category].append(source_path)
            if category == "models":
                models.extend(scan_models(file, app))
            if category == "serializers":
                serializers.extend(scan_named_classes(file, "Serializer"))
            if category == "views":
                scanned_views = scan_view_classes(file, app, pagination_names)
                for view in scanned_views:
                    view["app"] = app
                    view_index[view["name"]] = view
                views.extend(scanned_views)
                paginators.extend(scan_named_classes(file, "Pagination"))
            if category == "services":
                for service in scan_functions(file):
                    service["app"] = app
                    service["qualifiedName"] = f"{file.module}.{service['name']}"
                    all_services[service["qualifiedName"]] = service
                    services.append(service)
            if category == "permissions":
                permissions.extend(scan_named_classes(file, "Permission"))
            if category == "authentication":
                authentication_classes.extend(scan_named_classes(file, "Authentication"))
            if category == "throttling":
                throttles.extend(scan_named_classes(file, "Throttle"))
            if category == "validators":
                validators.extend(scan_functions(file, public_only=False))
                validators.extend(scan_named_classes(file, "Validator"))
            if category == "filters":
                filters.extend(scan_named_classes(file, "Filter"))
            if category == "selectors":
                selectors.extend(scan_functions(file))
            if category == "repositories":
                repositories.extend(scan_functions(file))
            if category == "tasks":
                tasks.extend(scan_functions(file, public_only=False))
            if category == "signals":
                signals.extend(scan_functions(file, public_only=False))
            if category == "commands":
                commands.extend(scan_named_classes(file, "Command"))
            external_imports = sorted({
                imported["module"] for imported in file.imports.values()
                if imported["module"].split(".")[0] in {"requests", "httpx", "opensearchpy"}
                or imported["module"] in {"http.client", "urllib.request"}
            })
            if external_imports:
                integrations.append({
                    "name": relative_module or filename.removesuffix(".py"),
                    "file": source_path,
                    "libraries": external_imports,
                    "certainty": "confirmed",
                })
            for imported in file.imports.values():
                match = re.match(r"apps\.([a-zA-Z0-9_]+)", imported["module"])
                if match and match.group(1) != app:
                    dependency_edges.append({
                        "from": app,
                        "to": match.group(1),
                        "type": "Python import",
                        "certainty": "confirmed",
                        "source": source_path,
                        "symbol": imported["name"],
                    })

        for model in models:
            for relation in model["relations"]:
                model_edges.append({
                    "from": f"{app}.{model['name']}",
                    "to": relation["target"],
                    "type": relation["type"],
                    "field": relation["field"],
                    "certainty": "confirmed",
                    "source": model["file"],
                    "line": relation["line"],
                })

        findings: list[dict[str, Any]] = []
        for view in views:
            long_methods = [method for method in view["methods"] if method["lines"] >= 55 or method["statementCount"] >= 35]
            direct_business = [method for method in view["methods"] if method["objectAccessCount"] >= 2 and not method["services"]]
            if long_methods:
                findings.append({
                    "id": f"large-view-{app}-{view['name']}",
                    "title": f"{view['name']} conține metode HTTP mari",
                    "severity": "medium",
                    "certainty": "confirmed",
                    "evidence": ", ".join(f"{method['method']}: {method['lines']} linii/{method['statementCount']} instrucțiuni" for method in long_methods),
                    "files": [view["file"]],
                    "apps": [app],
                    "recommendation": "Verifică dacă orchestration/business rules pot fi mutate într-un serviciu focalizat; nu separa maparea HTTP simplă.",
                })
            if direct_business:
                findings.append({
                    "id": f"business-in-view-{app}-{view['name']}",
                    "title": f"Acces repetat la modele direct în {view['name']}",
                    "severity": "medium",
                    "certainty": "confirmed",
                    "evidence": ", ".join(f"{method['method']}: {method['objectAccessCount']} accesări .objects fără serviciu apelat" for method in direct_business),
                    "files": [view["file"]],
                    "apps": [app],
                    "recommendation": "Confirmă dacă logica este doar query composition; pentru reguli reutilizabile definește o limită de serviciu/selectare.",
                })
        for serializer in serializers:
            if serializer["lines"] >= 140:
                findings.append({
                    "id": f"large-serializer-{app}-{serializer['name']}",
                    "title": f"Serializer mare: {serializer['name']}",
                    "severity": "medium",
                    "certainty": "confirmed",
                    "evidence": f"Clasa are {serializer['lines']} linii și {len(serializer['methods'])} metode.",
                    "files": [serializer["file"]],
                    "apps": [app],
                    "recommendation": "Separă validările sau contractele numai dacă au responsabilități independente și consumatori distincți.",
                })
            important_methods = [
                method for method in serializer["methodMetrics"]
                if method["statements"] >= 25 or method["objectAccesses"] >= 2
            ]
            if important_methods:
                findings.append({
                    "id": f"logic-in-serializer-{app}-{serializer['name']}",
                    "title": f"Logică importantă în serializer: {serializer['name']}",
                    "severity": "medium",
                    "certainty": "confirmed",
                    "evidence": ", ".join(
                        f"{method['name']}: {method['lines']} linii/{method['statements']} instrucțiuni/{method['objectAccesses']} accesări .objects"
                        for method in important_methods
                    ),
                    "files": [serializer["file"]],
                    "apps": [app],
                    "recommendation": "Confirmă dacă validarea aparține contractului de input sau reprezintă reguli de business/autorizare care trebuie coordonate într-un serviciu; nu muta validarea de câmp simplă.",
                })
        large_files = [
            file for file in app_files
            if len(file.source.splitlines()) >= 400
            and "/tests/" not in f"/{posix(file.path)}"
            and not file.path.name.startswith("test")
        ]
        for file in large_files:
            findings.append({
                "id": f"large-file-{app}-{file.path.stem}",
                "title": f"Fișier backend mare: {file.path.name}",
                "severity": "medium",
                "certainty": "confirmed",
                "evidence": f"{posix(file.path)} are {len(file.source.splitlines())} linii.",
                "files": [posix(file.path)],
                "apps": [app],
                "recommendation": "Revizuiește responsabilitățile fișierului și separă doar module cu coeziune proprie; dimensiunea este un semnal, nu un defect în sine.",
            })
        for signal in signals:
            findings.append({
                "id": f"signal-effect-{app}-{signal['name']}",
                "title": f"Efect implicit prin signal: {signal['name']}",
                "severity": "info",
                "certainty": "confirmed",
                "evidence": f"Receiver declarat în {signal['file']}:{signal['line']}; apeluri: {', '.join(signal['calls']) or 'operații locale'}.",
                "files": [signal["file"]],
                "apps": [app],
                "recommendation": "Păstrează efectul documentat și acoperit de teste; evită lanțuri suplimentare de signals.",
            })
        if not views and not models and not services and not tasks:
            findings.append({
                "id": f"apparently-unused-{app}",
                "title": f"Modulul {app} nu are implementare activă detectabilă",
                "severity": "info",
                "certainty": "inference",
                "evidence": "Aplicația este în INSTALLED_APPS, dar scannerul nu a găsit views, modele, servicii sau tasks.",
                "files": sorted(set(sum(categories.values(), []))),
                "apps": [app],
                "recommendation": "Confirmă dacă modulul este un placeholder intenționat înainte de a-l elimina sau consolida.",
            })
        all_findings.extend(findings)
        applications.append({
            "id": app,
            "name": app,
            "type": "django-app",
            "config": next((posix(file.path) for file in app_files if file.path.name == "apps.py"), None),
            "files": {key: sorted(set(values)) for key, values in sorted(categories.items())},
            "models": models,
            "views": views,
            "serializers": serializers,
            "services": services,
            "permissions": permissions,
            "authenticationClasses": authentication_classes,
            "throttles": throttles,
            "paginators": paginators,
            "validators": validators,
            "filters": filters,
            "selectors": selectors,
            "repositories": repositories,
            "signals": signals,
            "tasks": tasks,
            "managementCommands": commands,
            "integrations": integrations,
            "urls": [],
            "tests": sorted(set(tests)),
            "dependencies": [],
            "findings": findings,
        })

    for file in parsed.values():
        if not file.module.startswith("config."):
            continue
        for view in scan_view_classes(file, "config", pagination_names):
            view["app"] = "config"
            view_index[view["name"]] = view

    endpoints = scan_url_module("config.urls", "", parsed, view_index)
    endpoints = [endpoint for endpoint in endpoints if endpoint["path"].startswith("/api/")]
    for index, endpoint in enumerate(endpoints, start=1):
        endpoint["id"] = f"endpoint-{index:03d}-{endpoint['method'].lower()}"
        endpoint["category"] = endpoint_category(endpoint["path"], endpoint["method"], endpoint["view"])
        endpoint["usage"] = "neverificat"
        endpoint["certainty"] = "confirmed" if endpoint["view"] else "inference"
        endpoint["errorShape"] = (
            ", ".join(endpoint["errorSerializers"])
            if endpoint["errorSerializers"]
            else "{code, detail, fields} prin StandardizedJSONRenderer (global)"
        )
        endpoint["reactConsumers"] = []
        endpoint["reactRoutes"] = []
        endpoint["backendConsumers"] = []
        app = next((item for item in applications if item["id"] == endpoint["app"]), None)
        if app:
            app["urls"].append({
                "method": endpoint["method"], "path": endpoint["path"], "name": endpoint["routeName"],
                "view": endpoint["view"], "file": endpoint["urlConfiguration"]["file"],
            })

    unique_dependencies = {
        (edge["from"], edge["to"], edge["source"], edge["symbol"]): edge
        for edge in dependency_edges
    }
    dependency_edges = list(unique_dependencies.values())
    for app in applications:
        app["dependencies"] = [edge for edge in dependency_edges if edge["from"] == app["id"] or edge["to"] == app["id"]]

    graph: list[dict[str, Any]] = [
        *[{"from": edge["from"], "to": edge["to"], "type": "app-import", **{key: edge[key] for key in ("certainty", "source")}} for edge in dependency_edges],
        *[{"from": edge["from"], "to": edge["to"], "type": "model-relation", **{key: edge[key] for key in ("certainty", "source")}} for edge in model_edges],
    ]
    for endpoint in endpoints:
        graph.append({"from": f"{endpoint['method']} {endpoint['path']}", "to": endpoint["view"], "type": "endpoint-view", "certainty": "confirmed", "source": endpoint["urlConfiguration"]["file"]})
        for serializer in filter(None, [endpoint["requestSerializer"], *endpoint["responseSerializers"], *endpoint["errorSerializers"]]):
            graph.append({"from": endpoint["view"], "to": serializer, "type": "view-serializer", "certainty": "confirmed", "source": endpoint["viewSource"]["file"]})
        for service in endpoint["services"]:
            graph.append({"from": endpoint["view"], "to": service, "type": "view-service", "certainty": "confirmed", "source": endpoint["viewSource"]["file"]})
        for model in endpoint["models"]:
            graph.append({"from": endpoint["view"], "to": model, "type": "view-model", "certainty": "confirmed", "source": endpoint["viewSource"]["file"]})
    for service in all_services.values():
        for model in service["models"]:
            graph.append({"from": service["qualifiedName"], "to": model, "type": "service-model", "certainty": "confirmed", "source": service["file"]})
        for call in service["calls"]:
            if ".services." in call:
                graph.append({"from": service["qualifiedName"], "to": call, "type": "service-service", "certainty": "confirmed", "source": service["file"]})
    for app in applications:
        for serializer in app["serializers"]:
            for model in serializer["models"]:
                graph.append({"from": serializer["name"], "to": model, "type": "serializer-model", "certainty": "confirmed", "source": serializer["file"]})
        for task in app["tasks"]:
            for call in task["calls"]:
                graph.append({"from": f"apps.{app['id']}.tasks.{task['name']}", "to": call, "type": "task-service", "certainty": "confirmed", "source": task["file"]})
        for integration in app["integrations"]:
            graph.append({"from": app["id"], "to": integration["name"], "type": "external-integration", "certainty": "confirmed", "source": integration["file"]})

    source_fingerprint = hashlib.sha256("\0".join(
        f"{module}\0{file.source}" for module, file in sorted(parsed.items())
    ).encode()).hexdigest()
    return {
        "meta": {
            "scannerVersion": 2,
            "sourceFingerprint": source_fingerprint,
            "pythonFiles": len(parsed),
            "djangoApplications": len(applications),
            "endpoints": len(endpoints),
            "drfRouters": sum(1 for file in parsed.values() if ".register(" in file.source and "router" in file.source),
            "openApi": {
                "materializedSchemaFound": False,
                "source": "extend_schema decorators + SPECTACULAR_SETTINGS",
                "schemaEndpoint": "/api/schema",
                "note": "Nu există un artefact OpenAPI versionat; contractele sunt extrase static din decoratori.",
            },
        },
        "api": {"endpoints": endpoints},
        "backend": {
            "applications": applications,
            "dependencies": dependency_edges,
            "modelRelations": model_edges,
            "graph": graph,
            "findings": all_findings,
        },
    }


if __name__ == "__main__":
    json.dump(scan(), sys.stdout, ensure_ascii=False, separators=(",", ":"))

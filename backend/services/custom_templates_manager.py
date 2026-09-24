"""
Custom Templates Manager
========================
Provides JSON-persisted CRUD and duplication for user-created custom resume templates.
Supports authenticated users and guest sessions.
"""

import json
import os
import uuid
from datetime import datetime
from typing import List, Dict, Optional, Any
from models.auth_schemas import TemplateItem, CustomTemplateCreate, CustomTemplateUpdate
from data.templates_db import TEMPLATES_BY_ID, ALL_TEMPLATES

STORAGE_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "custom_templates.json")


class CustomTemplateManager:
    def __init__(self, storage_path: str = STORAGE_FILE):
        self.storage_path = os.path.abspath(storage_path)
        self._ensure_storage()

    def _ensure_storage(self):
        os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
        if not os.path.exists(self.storage_path):
            with open(self.storage_path, "w", encoding="utf-8") as f:
                json.dump([], f, indent=2)

    def _read_all(self) -> List[Dict[str, Any]]:
        try:
            with open(self.storage_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _write_all(self, items: List[Dict[str, Any]]):
        with open(self.storage_path, "w", encoding="utf-8") as f:
            json.dump(items, f, indent=2, ensure_ascii=False)

    def get_user_templates(self, user_email: Optional[str] = None) -> List[TemplateItem]:
        """Returns all custom templates belonging to user or public guest templates."""
        records = self._read_all()
        results = []
        for r in records:
            owner = r.get("created_by")
            if not user_email or owner == user_email or owner in [None, "guest", "anonymous"]:
                results.append(TemplateItem(**r["template"]))
        return results

    def get_custom_template(self, template_id: str) -> Optional[TemplateItem]:
        records = self._read_all()
        for r in records:
            if r.get("id") == template_id or r.get("template", {}).get("id") == template_id:
                return TemplateItem(**r["template"])
        return None

    def create_custom_template(
        self,
        payload: CustomTemplateCreate,
        user_email: Optional[str] = "guest"
    ) -> TemplateItem:
        """Creates a custom template from blank or clones base template."""
        records = self._read_all()
        template_uuid = f"custom_{uuid.uuid4().hex[:8]}"

        # Look up base template if specified
        base = TEMPLATES_BY_ID.get(payload.base_template_id or "", None)

        layout_type = payload.column_layout or (base.layout_type if base else "single_column")
        if payload.sidebar_position == "left":
            layout_type = "left_sidebar"
        elif payload.sidebar_position == "right":
            layout_type = "right_sidebar"
        elif payload.header_style == "banner":
            layout_type = "header_accent"

        columns = 2 if layout_type in ["two_column", "left_sidebar", "right_sidebar"] else 1

        # Merge section titles
        section_titles = dict(base.default_section_titles if base else {})
        if payload.section_titles:
            section_titles.update(payload.section_titles)

        item = TemplateItem(
            id=template_uuid,
            name=payload.name.strip(),
            description=payload.description or "User custom designed resume template",
            category="Custom",
            industry=payload.industry or (base.industry if base else "General"),
            career_level="Custom",
            is_pro=False,
            thumbnail_color=payload.accent_color or (base.thumbnail_color if base else "#2563EB"),
            secondary_color=payload.secondary_color or (base.secondary_color if base else "#1E293B"),
            font_family=payload.font_family or (base.font_family if base else "Inter"),
            layout_type=layout_type,
            spacing=payload.spacing or "normal",
            tags=["custom", "user-designed", layout_type],
            rating=5.0,
            downloads_count=1,
            recommended_for=["Personal Application", payload.industry or "General"],
            columns=columns,
            header_style=payload.header_style or "standard",
            sidebar_position=payload.sidebar_position or "none",
            ats_compatibility="High" if columns == 1 else "Standard",
            default_section_titles=section_titles,
            is_custom=True,
            created_by=user_email or "guest"
        )

        record = {
            "id": template_uuid,
            "created_by": user_email or "guest",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "template": item.dict(),
            "customization": payload.dict()
        }

        records.append(record)
        self._write_all(records)
        return item

    def update_custom_template(
        self,
        template_id: str,
        payload: CustomTemplateUpdate,
        user_email: Optional[str] = None
    ) -> Optional[TemplateItem]:
        records = self._read_all()
        updated_item = None

        for r in records:
            if r.get("id") == template_id:
                t_dict = r["template"]

                if payload.name:
                    t_dict["name"] = payload.name
                if payload.description:
                    t_dict["description"] = payload.description
                if payload.font_family:
                    t_dict["font_family"] = payload.font_family
                if payload.accent_color:
                    t_dict["thumbnail_color"] = payload.accent_color
                if payload.secondary_color:
                    t_dict["secondary_color"] = payload.secondary_color
                if payload.spacing:
                    t_dict["spacing"] = payload.spacing
                if payload.header_style:
                    t_dict["header_style"] = payload.header_style
                if payload.sidebar_position:
                    t_dict["sidebar_position"] = payload.sidebar_position
                if payload.column_layout:
                    if payload.column_layout == "two_column":
                        t_dict["columns"] = 2
                        t_dict["layout_type"] = "two_column"
                    else:
                        t_dict["columns"] = 1
                        t_dict["layout_type"] = "single_column"
                if payload.section_titles:
                    t_dict["default_section_titles"] = {
                        **t_dict.get("default_section_titles", {}),
                        **payload.section_titles
                    }

                r["updated_at"] = datetime.utcnow().isoformat()
                updated_item = TemplateItem(**t_dict)
                r["template"] = t_dict
                break

        if updated_item:
            self._write_all(records)
        return updated_item

    def duplicate_custom_template(
        self,
        template_id: str,
        new_name: Optional[str] = None,
        user_email: Optional[str] = "guest"
    ) -> Optional[TemplateItem]:
        """Duplicates either a standard catalog template or existing custom template."""
        # Check in custom templates first
        target = self.get_custom_template(template_id)
        if not target and template_id in TEMPLATES_BY_ID:
            target = TEMPLATES_BY_ID[template_id]

        if not target:
            return None

        duplicate_id = f"custom_dup_{uuid.uuid4().hex[:8]}"
        name = new_name or f"{target.name} (Copy)"

        item = TemplateItem(
            id=duplicate_id,
            name=name,
            description=f"Duplicate of {target.name}",
            category="Custom",
            industry=target.industry,
            career_level=target.career_level,
            is_pro=False,
            thumbnail_color=target.thumbnail_color,
            secondary_color=target.secondary_color,
            font_family=target.font_family,
            layout_type=target.layout_type,
            spacing=target.spacing,
            tags=["custom", "duplicated"],
            rating=5.0,
            downloads_count=1,
            recommended_for=target.recommended_for,
            columns=target.columns,
            header_style=target.header_style,
            sidebar_position=target.sidebar_position,
            ats_compatibility=target.ats_compatibility,
            default_section_titles=dict(target.default_section_titles),
            is_custom=True,
            created_by=user_email or "guest"
        )

        records = self._read_all()
        record = {
            "id": duplicate_id,
            "created_by": user_email or "guest",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "template": item.dict()
        }
        records.append(record)
        self._write_all(records)
        return item

    def delete_custom_template(self, template_id: str, user_email: Optional[str] = None) -> bool:
        records = self._read_all()
        initial_len = len(records)
        records = [r for r in records if r.get("id") != template_id]
        if len(records) < initial_len:
            self._write_all(records)
            return True
        return False


custom_template_manager = CustomTemplateManager()

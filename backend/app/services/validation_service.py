import re


def validate_email(email: str | None) -> str | None:
    if not email:
        return "Missing email"

    pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"

    if not re.match(pattern, email):
        return "Invalid email"

    return None


def validate_name(name: str | None) -> str | None:
    if not name or not name.strip():
        return "Missing name"

    return None


def validate_company(company: str | None) -> str | None:
    if not company or not company.strip():
        return "Missing company"

    return None


def validate_phone(phone: str | None) -> str | None:
    if not phone or not phone.strip():
        return "Missing phone"

    digits = re.sub(r"\D", "", phone)

    if len(digits) != 10:
        return "Invalid phone number"

    return None


def validate_city(city: str | None) -> str | None:
    if not city or not city.strip():
        return "City is required"

    return None


def validate_row(row: dict) -> list[str]:
    errors = []

    name_error = validate_name(row.get("name"))
    if name_error:
        errors.append(name_error)

    email_error = validate_email(row.get("email"))
    if email_error:
        errors.append(email_error)

    phone_error = validate_phone(row.get("phone"))
    if phone_error:
        errors.append(phone_error)

    company_error = validate_company(row.get("company"))
    if company_error:
        errors.append(company_error)

    city_error = validate_city(row.get("city"))
    if city_error:
        errors.append(city_error)

    return errors


def validate_rows(rows: list[dict]) -> list[dict]:
    results = []
    seen_emails = set()

    # start=2 assumes row 1 is header
    for row_number, row in enumerate(rows, start=2):
        errors = validate_row(row)

        email = row.get("email")
        if email:
            normalized_email = email.strip().lower()
            if normalized_email in seen_emails:
                errors.append("Duplicate email")
            else:
                seen_emails.add(normalized_email)

        results.append({
            "row_number": row_number,
            "data": row,
            "is_valid": len(errors) == 0,
            "validation_reasons": errors
        })

    return results

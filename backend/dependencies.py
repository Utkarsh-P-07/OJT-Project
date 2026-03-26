from fastapi import Header, HTTPException

def verify_admin_role(x_user_role: str = Header(default="", alias="x-user-role")):
    """
    Verify the user provides the correct admin role header.
    """
    if x_user_role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin access only.")
    return x_user_role

def verify_user_role(x_user_role: str = Header(default="", alias="x-user-role")):
    """
    Verify the user provides either user or admin role header.
    Admins can also use user APIs if needed.
    """
    role = x_user_role.lower()
    if role not in ["user", "admin"]:
        raise HTTPException(status_code=403, detail="Forbidden: Valid role header 'user' or 'admin' required.")
    return role

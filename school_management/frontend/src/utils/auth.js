export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    SCHOOL_ADMIN: 'school_admin',
    TEACHER: 'teacher',
    STAFF: 'staff',
    STUDENT: 'student',
};

export function getStoredUser() {
    try {
        const storedUser = localStorage.getItem('school_user');
        return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
        console.error('Unable to parse stored user:', error);
        return null;
    }
}

export function getCurrentRole() {
    return getStoredUser()?.role || null;
}

export function isSuperAdmin() {
    return getCurrentRole() === ROLES.SUPER_ADMIN;
}

export function isSchoolAdmin() {
    return getCurrentRole() === ROLES.SCHOOL_ADMIN;
}

export function isTeacher() {
    return [ROLES.TEACHER, ROLES.STAFF].includes(getCurrentRole());
}

export function isStudent() {
    return getCurrentRole() === ROLES.STUDENT;
}

export function getRoleLabel(role = getCurrentRole()) {
    switch (role) {
        case ROLES.SUPER_ADMIN:
            return 'Super Admin';
        case ROLES.SCHOOL_ADMIN:
            return 'School Admin';
        case ROLES.TEACHER:
            return 'Teacher';
        case ROLES.STAFF:
            return 'Staff';
        case ROLES.STUDENT:
            return 'Student';
        default:
            return 'Administrator';
    }
}

export function getDashboardPath(role = getCurrentRole()) {
    switch (role) {
        case ROLES.SUPER_ADMIN:
            return '/dashboard';
        case ROLES.SCHOOL_ADMIN:
            return '/school-dashboard';
        case ROLES.TEACHER:
        case ROLES.STAFF:
            return '/teacher-dashboard';
        case ROLES.STUDENT:
            return '/school-dashboard';
        default:
            return '/';
    }
}

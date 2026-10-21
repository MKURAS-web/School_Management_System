import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../../api/api';
import SchoolAdminEditModal from './SchoolAdminEditModal';
import SchoolAdminCreateModal from './SchoolAdminCreateModal';

function SchoolAdminsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [admins, setAdmins] = useState([]);
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);

    const schoolIdFilter = searchParams.get('schoolId');
    const selectedSchool = schools.find((school) => String(school.id) === String(schoolIdFilter)) || null;
    const assignedSchoolIds = Array.from(
        new Set(
            admins
                .map((admin) => admin.school_id ?? admin.school?.id)
                .filter((schoolId) => schoolId !== null && schoolId !== undefined && schoolId !== '')
        )
    );
    const filteredAdmins = schoolIdFilter
        ? admins.filter((admin) => {
            const adminSchoolId = admin.school_id ?? admin.school?.id;
            return String(adminSchoolId) === String(schoolIdFilter);
        })
        : admins;

    const fetchAdmins = async () => {
        try {
            const res = await api.get('/school-admins');
            setAdmins(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSchools = async () => {
        try {
            const res = await api.get('/schools');
            setSchools(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchAdmins();
        fetchSchools();
    }, []);

    

    const handleDelete = async (id) => {
        if (!confirm('Delete this school admin?')) return;

        try {
            await api.delete(`/school-admins/${id}`);
            setAdmins(admins.filter(a => a.id !== id));
        } catch (err) {
            console.error(err);
            alert('Failed to delete admin.');
        }
    };

    const openEdit = (admin) => {
        setSelectedAdmin(admin);
        setModalOpen(true);
    };

    return (
        <div className="school-admins-page">
            <div className="page-header">
                <div>
                    <h1>{selectedSchool ? `${selectedSchool.name} Admins` : 'School Admins'}</h1>
                    <p>Manage school admin accounts and assignments.</p>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button className="primary-button" onClick={() => setModalOpen(true)}>Add School Admin</button>
                    {schoolIdFilter && (
                        <button
                            type="button"
                            className="view-button"
                            onClick={() => setSearchParams({})}
                        >
                            Show All Admins
                        </button>
                    )}
                </div>
            </div>

            <div className="table-header">
                <h2>{selectedSchool ? `Existing admins for ${selectedSchool.name}` : 'Existing Admins'}</h2>
                <span>{filteredAdmins.length} admin(s)</span>
            </div>

            <div className="table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>School</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredAdmins.map(a => (
                            <tr key={a.id}>
                                <td>{a.name}</td>
                                <td>{a.email}</td>
                                <td>{a.school?.name || '-'}</td>
                                <td>
                                    <button className="edit-button" onClick={() => openEdit(a)}>Edit</button>
                                    <button className="delete-button" onClick={() => handleDelete(a.id)} style={{ marginLeft: 8 }}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>


            <SchoolAdminEditModal
                open={modalOpen && Boolean(selectedAdmin)}
                admin={selectedAdmin}
                schools={schools}
                assignedSchoolIds={assignedSchoolIds}
                onClose={() => { setModalOpen(false); setSelectedAdmin(null); }}
                onSaved={(updated) => setAdmins(admins.map(a => a.id === updated.id ? updated : a))}
            />

            <SchoolAdminCreateModal
                open={modalOpen && !selectedAdmin}
                onClose={() => setModalOpen(false)}
                onSaved={(created) => setAdmins([created, ...admins])}
                schools={schools}
                assignedSchoolIds={assignedSchoolIds}
            />

        </div>
    );
}

export default SchoolAdminsPage;

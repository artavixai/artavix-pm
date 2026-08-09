import React, { useState, useEffect, useRef } from 'react';
import { userService, roleService, hashtagRuleService, userSettingService, systemSettingsService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import TaskTemplateManager from '../components/settings/TaskTemplateManager';
import StepTemplateManager from '../components/settings/StepTemplateManager';
import FormTemplateManager from '../components/settings/FormTemplateManager';
import ReportTemplateManager from '../components/settings/ReportTemplateManager';
import toast from 'react-hot-toast';
import { SERVER_URL } from '../config';

const UserIcon = (props) => <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" {...props}><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>;
const RoleIcon = (props) => <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" {...props}><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path></svg>;
const DisplayIcon = (props) => <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" {...props}><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>;
const DatabaseIcon = (props) => <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" {...props}><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path></svg>;
const CameraIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>;
const CapacityIcon = (props) => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;

const UserModal = ({ user, allRoles, isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({});
    const [selectedRoleIds, setSelectedRoleIds] = useState([]);
    const [previewImage, setPreviewImage] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const fileInputRef = useRef(null);
    const isEditMode = !!user;

    const roleNameMapping = {
      'SuperAdmin': 'Super Admin',
      'ProjectManager': 'Project Manager',
      'TeamMember': 'Team Member'
    };

    useEffect(() => {
        if (isOpen) {
            const initialData = isEditMode ? { ...user, password: '' } : 
                { username: '', fullName: '', email: '', password: '', jobTitle: '', phoneNumber: '', isActive: true };

            setFormData(initialData);

            if (isEditMode) {
                const currentUserRoleIds = allRoles.filter(role => user.roles.includes(role.name)).map(role => role.id);
                setSelectedRoleIds(currentUserRoleIds);
                setPreviewImage(user.avatarUrl ? `${SERVER_URL}/${user.avatarUrl}` : null);
            } else {
                setSelectedRoleIds([]);
                setPreviewImage(null);
            }
            setAvatarFile(null);
        }
    }, [user, allRoles, isOpen, isEditMode]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleRoleChange = (roleId) => {
        setSelectedRoleIds(prev => prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]);
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleSubmit = () => {
        onSave({ ...formData, roleIds: selectedRoleIds, avatarFile }, user?.id);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 modal-backdrop backdrop-blur-sm" dir="ltr">
        <div className="flat-card rounded-2xl p-8 max-w-3xl w-full bg-white max-h-[95vh] overflow-y-auto scrollbar-flat shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-8">{isEditMode ? `Edit User: ${user.fullName}` : 'Create New User'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="col-span-1 flex flex-col items-center">
                    <div className="relative group w-36 h-36">
                        <img
                            src={previewImage || `https://ui-avatars.com/api/?name=${formData.fullName || ' '}&background=random&color=fff`}
                            alt="Profile"
                            className="w-36 h-36 rounded-full object-cover border-4 border-slate-100 shadow-md"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current.click()}
                            className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <CameraIcon className="w-8 h-8" />
                        </button>
                    </div>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current.click()} className="mt-3 text-xs font-bold text-blue-600 hover:underline">
                        Upload Avatar
                    </button>
                </div>

                <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name *</label><input type="text" name="fullName" value={formData.fullName || ''} onChange={handleChange} className="flat-input w-full text-xs py-2" required /></div>
                        <div><label className="block text-xs font-bold text-slate-700 mb-1.5">Job Title</label><input type="text" name="jobTitle" value={formData.jobTitle || ''} onChange={handleChange} className="flat-input w-full text-xs py-2" /></div>
                    </div>
                    {!isEditMode && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-xs font-bold text-slate-700 mb-1.5">Username *</label><input type="text" name="username" value={formData.username || ''} onChange={handleChange} className="flat-input w-full text-xs py-2" required /></div>
                            <div><label className="block text-xs font-bold text-slate-700 mb-1.5">Password *</label><input type="password" name="password" value={formData.password || ''} onChange={handleChange} className="flat-input w-full text-xs py-2" required /></div>
                        </div>
                    )}
                     {isEditMode && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-xs font-bold text-slate-700 mb-1.5">Username (Read-only)</label><input type="text" value={formData.username || ''} className="flat-input w-full bg-slate-50 text-slate-400 cursor-not-allowed text-xs py-2" disabled /></div>
                            <div><label className="block text-xs font-bold text-slate-700 mb-1.5">New Password (Optional)</label><input type="password" name="password" placeholder="New Password" value={formData.password || ''} onChange={handleChange} className="flat-input w-full text-xs py-2" /></div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-slate-700 mb-1.5">Email *</label><input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="flat-input w-full text-xs py-2" required /></div>
                        <div><label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number *</label><input type="tel" name="phoneNumber" value={formData.phoneNumber || ''} onChange={handleChange} className="flat-input w-full text-xs py-2" required /></div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Roles *</label>
                        <div className="flex flex-wrap gap-3 p-3 bg-slate-50 rounded-xl">
                            {allRoles.map(role => (
                                <label key={role.id} className={`flex items-center space-x-2 cursor-pointer px-3 py-1.5 rounded-lg border transition-all ${selectedRoleIds.includes(role.id) ? 'bg-blue-100 border-blue-400' : 'bg-white border-slate-200'}`}>
                                    <input type="checkbox" checked={selectedRoleIds.includes(role.id)} onChange={() => handleRoleChange(role.id)} className="hidden" />
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedRoleIds.includes(role.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                      {selectedRoleIds.includes(role.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                    <span className="font-bold text-slate-800 text-xs">{roleNameMapping[role.name] || role.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex space-x-3 pt-6 mt-6 border-t">
                <button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-md">Save</button>
                <button onClick={onClose} className="flex-1 flat-button px-6 py-3 rounded-xl font-bold text-xs">Cancel</button>
            </div>
        </div>
      </div>
    );
};

const UsersTab = () => {
    const [users, setUsers] = useState([]);
    const [allRoles, setAllRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalState, setModalState] = useState({ isOpen: false, user: null });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersRes, rolesRes] = await Promise.all([userService.getAll(), roleService.getAll()]);
            setUsers(usersRes.data);
            setAllRoles(rolesRes.data);
        } catch (error) { toast.error("Error fetching users data."); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSaveUser = async (userData, userId) => {
        try {
            const dataToSend = new FormData();
            Object.keys(userData).forEach(key => {
              if (key !== 'roleIds' && key !== 'avatarFile') {
                 dataToSend.append(key, userData[key]);
              }
            });
            userData.roleIds.forEach(id => dataToSend.append('RoleIds', id));
            if (userData.avatarFile) {
                dataToSend.append('AvatarFile', userData.avatarFile);
            }

            if (userId) {
                await userService.update(userId, dataToSend);
                toast.success('User updated successfully.');
            } else {
                await userService.create(dataToSend);
                toast.success('New user created successfully.');
            }
            setModalState({ isOpen: false, user: null });
            fetchData();
        } catch (error) {
            toast.error("Operation failed.");
        }
    };

    const handleDeleteUser = async (user) => {
        if (window.confirm(`Are you sure you want to deactivate user "${user.fullName}"?`)) {
            try {
                await userService.delete(user.id);
                toast.success(`User ${user.fullName} deactivated.`);
                fetchData();
            } catch(error) {
                 toast.error("Failed to delete user.");
            }
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 text-xs">Loading users list...</div>;

    const roleNameMapping = { 'SuperAdmin': 'Super Admin', 'ProjectManager': 'Project Manager', 'TeamMember': 'Team Member' };

    return (
        <div dir="ltr">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-base font-bold text-slate-800">System Users</h2>
                <button onClick={() => setModalState({ isOpen: true, user: null })} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-xl font-bold text-xs hover:shadow-md transition-all">+ Add New User</button>
            </div>
            <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="p-3 font-bold text-slate-600">User</th>
                            <th className="p-3 font-bold text-slate-600">Username</th>
                            <th className="p-3 font-bold text-slate-600">Job Title</th>
                            <th className="p-3 font-bold text-slate-600">Phone</th>
                            <th className="p-3 font-bold text-slate-600">Roles</th>
                            <th className="p-3 font-bold text-slate-600">Status</th>
                            <th className="p-3 font-bold text-slate-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b hover:bg-slate-50">
                                <td className="p-3 text-slate-800 font-medium">
                                    <div className="flex items-center gap-3">
                                        <img src={user.avatarUrl ? `${SERVER_URL}/${user.avatarUrl}` : `https://ui-avatars.com/api/?name=${user.fullName}&background=random&color=fff`} alt={user.fullName} className="w-9 h-9 rounded-full object-cover"/>
                                        <div>
                                            <p className="font-bold text-slate-800">{user.fullName}</p>
                                            <p className="text-[10px] text-slate-400">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3 text-slate-700 font-mono">{user.username}</td>
                                <td className="p-3 text-slate-600 font-medium">{user.jobTitle || '-'}</td>
                                <td className="p-3 text-slate-600 font-mono">{user.phoneNumber || '-'}</td>
                                <td className="p-3 text-slate-500"><div className="flex flex-wrap gap-1">{user.roles.map(role => <span key={role} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold text-[10px]">{roleNameMapping[role] || role}</span>)}</div></td>
                                <td className="p-3"><span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{user.isActive ? 'Active' : 'Inactive'}</span></td>
                                <td className="p-3">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setModalState({ isOpen: true, user: user })} className="text-blue-600 hover:underline font-bold text-xs">Edit</button>
                                        <button onClick={() => handleDeleteUser(user)} className="text-red-600 hover:underline font-bold text-xs">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <UserModal
              user={modalState.user}
              allRoles={allRoles}
              isOpen={modalState.isOpen}
              onClose={() => setModalState({ isOpen: false, user: null })}
              onSave={handleSaveUser}
            />
        </div>
    );
};

const UserCapacityTab = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await userService.getAll();
            setUsers(res.data);
        } catch (err) {
            toast.error("Error fetching users list");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleInputChange = (userId, field, value) => {
        setUsers(prev => prev.map(u => 
            u.id === userId ? { ...u, [field]: parseInt(value) || 0 } : u
        ));
    };

    const handleSave = async (user) => {
        setUpdatingId(user.id);
        try {
            await userService.updateCapacity(user.id, {
                monthlyCapacityHours: user.monthlyCapacityHours,
                dailyCapacityHours: user.dailyCapacityHours
            });
            toast.success(`Capacity for ${user.fullName} updated.`);
        } catch (err) {
            toast.error("Error saving changes");
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 text-xs">Loading...</div>;

    return (
        <div dir="ltr">
            <h2 className="text-base font-bold text-slate-800 mb-6">Specialists Operational Capacity Management</h2>
            <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="p-3 font-bold text-slate-600">Specialist Name</th>
                            <th className="p-3 font-bold text-slate-600 text-center">Daily Capacity (Hours)</th>
                            <th className="p-3 font-bold text-slate-600 text-center">Monthly Capacity (Hours)</th>
                            <th className="p-3 font-bold text-slate-600 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b hover:bg-slate-50">
                                <td className="p-3">
                                    <div className="flex items-center gap-3">
                                        <img src={user.avatarUrl ? `${SERVER_URL}/${user.avatarUrl}` : `https://ui-avatars.com/api/?name=${user.fullName}&background=random&color=fff`} className="w-8 h-8 rounded-full object-cover" alt=""/>
                                        <span className="font-bold text-slate-800">{user.fullName}</span>
                                    </div>
                                </td>
                                <td className="p-3 text-center">
                                    <input 
                                        type="number" 
                                        value={user.dailyCapacityHours} 
                                        onChange={(e) => handleInputChange(user.id, 'dailyCapacityHours', e.target.value)}
                                        className="flat-input w-20 text-center py-1 rounded-lg text-xs"
                                    />
                                </td>
                                <td className="p-3 text-center">
                                    <input 
                                        type="number" 
                                        value={user.monthlyCapacityHours} 
                                        onChange={(e) => handleInputChange(user.id, 'monthlyCapacityHours', e.target.value)}
                                        className="flat-input w-24 text-center py-1 rounded-lg text-xs"
                                    />
                                </td>
                                <td className="p-3 text-center">
                                    <button 
                                        onClick={() => handleSave(user)}
                                        disabled={updatingId === user.id}
                                        className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {updatingId === user.id ? '...' : 'Save'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ActionDisplaySettingsTab = () => {
    const [minDuration, setMinDuration] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSetting = async () => {
            try {
                const res = await userSettingService.getMySetting();
                setMinDuration(res.data?.minActionDurationMinutes || 0);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSetting();
    }, []);

    const handleSave = async () => {
        try {
            await userSettingService.updateSetting({ minActionDurationMinutes: minDuration });
            toast.success("Settings saved successfully.");
        } catch (err) {
            toast.error("Error saving settings.");
        }
    };

    if (loading) return <div className="p-4 text-center text-slate-500 text-xs">Loading...</div>;

    return (
        <div dir="ltr">
            <h2 className="text-base font-bold text-slate-800 mb-6">CRM Action Display Settings</h2>
            <div className="p-4 border rounded-2xl bg-slate-50/50 max-w-lg">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                    Minimum Duration (Minutes) to Display Actions
                </label>
                <input
                    type="number"
                    min="0"
                    step="1"
                    value={minDuration}
                    onChange={(e) => setMinDuration(parseInt(e.target.value) || 0)}
                    className="flat-input w-32 text-center text-xs py-2 rounded-xl"
                />
                <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
                    Actions with duration less than this value will be hidden from the CRM Actions table.
                </p>
                <button
                    onClick={handleSave}
                    className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-xl font-bold text-xs hover:bg-blue-700"
                >
                    Save Settings
                </button>
            </div>
        </div>
    );
};

const HashtagRulesTab = () => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newHashtag, setNewHashtag] = useState('');
    const [newTargetType, setNewTargetType] = useState('ProjectStatus');
    const [newTargetValue, setNewTargetValue] = useState('');

    const fetchRules = async () => {
        try {
            const res = await hashtagRuleService.getAll();
            setRules(res.data);
        } catch (err) {
            toast.error("Error fetching rules.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const handleAdd = async () => {
        if (!newHashtag.trim() || !newTargetValue.trim()) {
            toast.error("Please enter hashtag and target value.");
            return;
        }
        try {
            await hashtagRuleService.create({
                hashtag: newHashtag.trim(),
                targetType: newTargetType,
                targetValue: newTargetValue.trim()
            });
            toast.success("Rule added successfully.");
            setNewHashtag('');
            setNewTargetValue('');
            fetchRules();
        } catch (err) {
            toast.error("Error adding rule.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this rule?")) {
            try {
                await hashtagRuleService.delete(id);
                toast.success("Rule deleted.");
                fetchRules();
            } catch (err) {
                toast.error("Error deleting rule.");
            }
        }
    };

    if (loading) return <div className="p-4 text-center text-slate-500 text-xs">Loading...</div>;

    return (
        <div dir="ltr">
            <h2 className="text-base font-bold text-slate-800 mb-6">Hashtag Rules Management</h2>
            <div className="mb-6 p-4 border rounded-2xl bg-slate-50">
                <h3 className="font-bold text-sm text-slate-800 mb-3">Add New Rule</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Hashtag (e.g. #Design)"
                        value={newHashtag}
                        onChange={(e) => setNewHashtag(e.target.value)}
                        className="flat-input text-xs py-2"
                    />
                    <select value={newTargetType} onChange={(e) => setNewTargetType(e.target.value)} className="flat-input text-xs py-2">
                        <option value="ProjectStatus">Update Project Status</option>
                        <option value="ChecklistStep">Check Step Checklist Item</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Target Value"
                        value={newTargetValue}
                        onChange={(e) => setNewTargetValue(e.target.value)}
                        className="flat-input text-xs py-2"
                    />
                    <button onClick={handleAdd} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-xs">Add Rule</button>
                </div>
            </div>
            <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="p-3 border-b font-bold">Hashtag</th>
                            <th className="p-3 border-b font-bold">Target Type</th>
                            <th className="p-3 border-b font-bold">Target Value</th>
                            <th className="p-3 border-b font-bold">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rules.map(rule => (
                            <tr key={rule.id} className="border-b hover:bg-slate-50">
                                <td className="p-3 font-bold text-blue-600">{rule.hashtag}</td>
                                <td className="p-3">{rule.targetType === 'ProjectStatus' ? 'Project Status' : 'Checklist Step'}</td>
                                <td className="p-3 font-semibold">{rule.targetValue}</td>
                                <td className="p-3">
                                    <button onClick={() => handleDelete(rule.id)} className="text-red-500 hover:text-red-700 font-bold text-xs">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const DisplaySettingsTab = () => {
    const { isSoundEnabled, toggleSound } = useAuth();

    return (
        <div dir="ltr">
            <h2 className="text-base font-bold text-slate-800 mb-6">Sound & Notification Settings</h2>
            <div className="flex items-center justify-between p-4 border rounded-2xl max-w-lg bg-slate-50">
                <label htmlFor="sound-toggle" className="font-bold text-xs text-slate-800">Play audio alarm on reminder notifications</label>
                <button id="sound-toggle" onClick={toggleSound} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isSoundEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}>
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isSoundEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
        </div>
    );
};

const FeatureFlagsTab = () => {
    const [features, setFeatures] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchFeatures = async () => {
        try {
            const res = await systemSettingsService.getAll();
            setFeatures(res.data);
        } catch (err) {
            toast.error("Error fetching feature flags");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchFeatures(); }, []);

    const toggleFeature = async (featureName, currentState) => {
        try {
            await systemSettingsService.update(featureName, !currentState);
            setFeatures(prev => prev.map(f => 
                f.featureName === featureName ? { ...f, isEnabled: !currentState } : f
            ));
            toast.success(`Feature ${!currentState ? 'enabled' : 'disabled'}.`);
        } catch (err) {
            toast.error("Error toggling feature");
        }
    };

    if (loading) return <div className="p-4 text-xs text-slate-500">Loading...</div>;

    return (
        <div dir="ltr">
            <h2 className="text-base font-bold text-slate-800 mb-6">System Feature Flags</h2>
            <div className="space-y-4 max-w-2xl">
                {features.map(feature => (
                    <div key={feature.featureName} className="flex items-center justify-between p-4 border rounded-2xl bg-white shadow-sm">
                        <div>
                            <h3 className="font-bold text-slate-800 text-xs">{feature.featureName}</h3>
                            <p className="text-[11px] text-slate-400 font-medium mt-0.5">{feature.description}</p>
                        </div>
                        <button
                            onClick={() => toggleFeature(feature.featureName, feature.isEnabled)}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${feature.isEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                        >
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${feature.isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Settings = () => {
    const [activeTab, setActiveTab] = useState('users');

    const renderContent = () => {
        switch (activeTab) {
            case 'users': return <UsersTab />;
            case 'capacity': return <UserCapacityTab />;
            case 'basicData': return <TaskTemplateManager />;
            case 'stepTemplates': return <StepTemplateManager />;
            case 'formTemplates': return <FormTemplateManager />;
            case 'reportTemplates': return <ReportTemplateManager />;
            case 'actionDisplay': return <ActionDisplaySettingsTab />;
            case 'hashtagRules': return <HashtagRulesTab />;
            case 'display': return <DisplaySettingsTab />;
            case 'featureFlags': return <FeatureFlagsTab />;
            default: return null;
        }
    };

    return (
        <div className="p-8" dir="ltr">
            <div className="mb-8">
                <h1 className="text-2xl font-black text-slate-800">System Settings</h1>
                <p className="mt-1 text-slate-500 text-xs font-medium">Manage user accounts, roles, process templates, and system configurations</p>
            </div>
            <div className="flex space-x-2 border-b border-slate-200 flex-wrap gap-y-2">
                <button onClick={() => setActiveTab('users')} className={`px-4 py-3 font-bold text-xs flex items-center border-b-2 transition-all ${activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}><UserIcon /> Users</button>
                <button onClick={() => setActiveTab('capacity')} className={`px-4 py-3 font-bold text-xs flex items-center border-b-2 transition-all ${activeTab === 'capacity' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}><CapacityIcon /> Capacity</button>
                <button onClick={() => setActiveTab('basicData')} className={`px-4 py-3 font-bold text-xs flex items-center border-b-2 transition-all ${activeTab === 'basicData' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}><DatabaseIcon /> Process Templates</button>
                <button onClick={() => setActiveTab('stepTemplates')} className={`px-4 py-3 font-bold text-xs flex items-center border-b-2 transition-all ${activeTab === 'stepTemplates' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}><DatabaseIcon /> Project Steps</button>
                <button onClick={() => setActiveTab('formTemplates')} className={`px-4 py-3 font-bold text-xs flex items-center border-b-2 transition-all ${activeTab === 'formTemplates' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}><DatabaseIcon /> Forms & Processes</button>
                <button onClick={() => setActiveTab('reportTemplates')} className={`px-4 py-3 font-bold text-xs flex items-center border-b-2 transition-all ${activeTab === 'reportTemplates' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}><DatabaseIcon /> General Reports</button>
                <button onClick={() => setActiveTab('actionDisplay')} className={`px-4 py-3 font-bold text-xs flex items-center border-b-2 transition-all ${activeTab === 'actionDisplay' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}><DisplayIcon /> CRM Display</button>
                <button onClick={() => setActiveTab('hashtagRules')} className={`px-4 py-3 font-bold text-xs flex items-center border-b-2 transition-all ${activeTab === 'hashtagRules' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}><RoleIcon /> Hashtags</button>
                <button onClick={() => setActiveTab('display')} className={`px-4 py-3 font-bold text-xs flex items-center border-b-2 transition-all ${activeTab === 'display' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}><DisplayIcon /> Sound Settings</button>
                <button onClick={() => setActiveTab('featureFlags')} className={`px-4 py-3 font-bold text-xs flex items-center border-b-2 transition-all ${activeTab === 'featureFlags' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}><DatabaseIcon /> Feature Flags</button>
            </div>
            <div className="flat-card bg-white rounded-b-2xl p-8">
                {renderContent()}
            </div>
        </div>
    );
};

export default Settings;
import React, { useState } from 'react';
import { Dropdown, DropdownToggle, DropdownMenu, Spinner } from 'reactstrap';
import { toast } from 'react-toastify';
import SimpleBar from 'simplebar-react';

import {
    getTodoTaskList,
    createTodoTask,
    updateTodoTaskStatus,
    deleteTodoTask,
} from '../../helpers/backend_helper';

const ToDoDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [taskText, setTaskText] = useState('');
    const [taskError, setTaskError] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [tasks, setTasks] = useState([]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await getTodoTaskList();
            setTasks(res?.data?.data || res?.data || []);
        } catch {
            toast.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    const toggle = () => {
        const next = !isOpen;
        setIsOpen(next);
        if (next) fetchTasks();
    };

    const handleSave = async () => {
        if (!taskText.trim()) {
            setTaskError('Please enter a task.');
            return;
        }
        setTaskError('');
        setSaving(true);
        try {
            await createTodoTask({ task_text: taskText.trim() });
            setTaskText('');
            toast.success('Task saved successfully.');
            await fetchTasks();
        } catch (err) {
            toast.error(typeof err === 'string' ? err : 'Failed to save task');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setTaskText('');
        setTaskError('');
    };

    const toggleComplete = async (task) => {
        const nextStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
        // Optimistic update — flip it in the list immediately, reconcile with the server after.
        setTasks(prev => prev.map(t => t.todo_id === task.todo_id ? { ...t, status: nextStatus } : t));
        try {
            await updateTodoTaskStatus(task.todo_id, { status: nextStatus });
        } catch {
            toast.error('Failed to update task');
            setTasks(prev => prev.map(t => t.todo_id === task.todo_id ? { ...t, status: task.status } : t));
        }
    };

    const handleDelete = async (task) => {
        const prevTasks = tasks;
        setTasks(prev => prev.filter(t => t.todo_id !== task.todo_id));
        try {
            await deleteTodoTask(task.todo_id);
        } catch {
            toast.error('Failed to delete task');
            setTasks(prevTasks);
        }
    };

    return (
        <Dropdown isOpen={isOpen} toggle={toggle} className="topbar-head-dropdown ms-1 header-item">
            <DropdownToggle type="button" tag="button"
                className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
                title="To-Do Task">
                <i className="bx bx-task fs-22"></i>
            </DropdownToggle>
            <DropdownMenu className="dropdown-menu-end p-0" style={{ width: 320 }}>
                <div style={{ background: '#fff8dc', borderRadius: '0.25rem 0.25rem 0 0' }} className="p-3">
                    <h6 className="m-0 fs-14 fw-semibold text-dark">
                        <i className="bx bx-note me-1"></i> To-Do Task
                    </h6>
                </div>

                <div style={{ background: '#fffbe8' }} className="p-3">
                    <textarea
                        className="form-control form-control-sm"
                        rows={3}
                        placeholder="Write your task here..."
                        value={taskText}
                        onChange={e => { setTaskText(e.target.value); if (taskError) setTaskError(''); }}
                        style={{ background: '#fffef2', resize: 'none' }}
                    />
                    {taskError && (
                        <div className="text-danger fs-11 mt-1">{taskError}</div>
                    )}
                    <div className="d-flex justify-content-end gap-2 mt-2">
                        <button type="button" className="btn btn-light btn-sm" onClick={handleCancel} disabled={saving}>
                            Cancel
                        </button>
                        <button type="button" className="btn btn-warning btn-sm" onClick={handleSave} disabled={saving}>
                            {saving ? <><Spinner size="sm" className="me-1" />Saving...</> : 'Save'}
                        </button>
                    </div>
                </div>

                <div className="border-top">
                    <SimpleBar style={{ maxHeight: 220 }}>
                        <div className="p-2">
                            {loading ? (
                                <div className="text-center py-3">
                                    <Spinner size="sm" />
                                </div>
                            ) : tasks.length === 0 ? (
                                <div className="text-center text-muted fs-12 py-3">No tasks yet</div>
                            ) : (
                                tasks.map(task => (
                                    <div key={task.todo_id}
                                        className="d-flex align-items-start gap-2 px-2 py-2 rounded"
                                        style={{ background: '#fffbe8' }}>
                                        <div className="form-check mt-0">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={task.status === 'COMPLETED'}
                                                onChange={() => toggleComplete(task)}
                                            />
                                        </div>
                                        <div className="flex-grow-1 fs-13"
                                            style={task.status === 'COMPLETED'
                                                ? { textDecoration: 'line-through', color: '#9a9a80' }
                                                : { color: '#5c5320' }}>
                                            {task.task_text}
                                        </div>
                                        <button type="button"
                                            className="btn btn-link btn-sm p-0 text-muted"
                                            title="Delete task"
                                            onClick={() => handleDelete(task)}>
                                            <i className="bx bx-trash fs-15"></i>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </SimpleBar>
                </div>
            </DropdownMenu>
        </Dropdown>
    );
};

export default ToDoDropdown;

import React, { useState, useEffect, useMemo } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';

import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Calendar,
  LayoutDashboard,
  ListTodo,
  BarChart3,
  Activity,
  Target
} from 'lucide-react';

import { auth, db } from './firebase';

export default function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filter, setFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium'
  });

  // Authentication
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error(err);
        setError('Authentication failed');
      }
    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch tasks
  useEffect(() => {
    if (!user) return;

    const tasksRef = collection(db, 'users', user.uid, 'tasks');

    const unsubscribe = onSnapshot(
      tasksRef,
      (snapshot) => {
        const fetchedTasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        fetchedTasks.sort((a, b) => b.createdAt - a.createdAt);

        setTasks(fetchedTasks);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError('Failed to load tasks');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit task
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || !formData.title.trim()) return;

    try {
      const tasksRef = collection(db, 'users', user.uid, 'tasks');

      if (editingTask) {
        const taskDoc = doc(tasksRef, editingTask.id);

        await updateDoc(taskDoc, {
          title: formData.title.trim(),
          description: formData.description.trim(),
          priority: formData.priority,
          updatedAt: Date.now()
        });
      } else {
        await addDoc(tasksRef, {
          title: formData.title.trim(),
          description: formData.description.trim(),
          priority: formData.priority,
          status: 'pending',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }

      setFormData({
        title: '',
        description: '',
        priority: 'medium'
      });

      setEditingTask(null);
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle status
  const toggleTaskStatus = async (task) => {
    try {
      const taskDoc = doc(db, 'users', user.uid, 'tasks', task.id);

      await updateDoc(taskDoc, {
        status: task.status === 'pending' ? 'completed' : 'pending',
        updatedAt: Date.now()
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Delete task
  const deleteTask = async (taskId) => {
    try {
      const taskDoc = doc(db, 'users', user.uid, 'tasks', taskId);

      await deleteDoc(taskDoc);
    } catch (err) {
      console.error(err);
    }
  };

  // Edit task
  const editTask = (task) => {
    setEditingTask(task);

    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium'
    });

    setIsFormOpen(true);
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingTask(null);

    setFormData({
      title: '',
      description: '',
      priority: 'medium'
    });

    setIsFormOpen(false);
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks;

    return tasks.filter((task) => task.status === filter);
  }, [tasks, filter]);

  // Stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(
      (t) => t.status === 'completed'
    ).length;

    const pending = total - completed;

    const progress =
      total === 0
        ? 0
        : Math.round((completed / total) * 100);

    return {
      total,
      completed,
      pending,
      progress
    };
  }, [tasks]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';

      case 'medium':
        return 'text-amber-600 bg-amber-100';

      case 'low':
        return 'text-emerald-600 bg-emerald-100';

      default:
        return 'text-slate-600 bg-slate-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 text-lg">
          Loading...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-red-100 text-red-600 p-4 rounded-xl">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <ListTodo className="text-white w-5 h-5" />
            </div>

            <h1 className="text-xl font-bold text-indigo-600">
              TaskFlow
            </h1>
          </div>

          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <p className="text-slate-500 text-sm">
              Total Tasks
            </p>

            <h2 className="text-3xl font-bold">
              {stats.total}
            </h2>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <p className="text-slate-500 text-sm">
              Pending
            </p>

            <h2 className="text-3xl font-bold">
              {stats.pending}
            </h2>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <p className="text-slate-500 text-sm">
              Completed
            </p>

            <h2 className="text-3xl font-bold">
              {stats.completed}
            </h2>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <p className="text-slate-500 text-sm">
              Progress
            </p>

            <h2 className="text-3xl font-bold">
              {stats.progress}%
            </h2>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['all', 'pending', 'completed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg capitalize ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Task List */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {filteredTasks.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No tasks found
            </div>
          ) : (
            <ul>
              {filteredTasks.map((task) => (
                <li
                  key={task.id}
                  className="border-b p-4 flex gap-4 items-start"
                >
                  <button
                    onClick={() => toggleTaskStatus(task)}
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="text-emerald-500" />
                    ) : (
                      <Circle className="text-slate-300" />
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3
                        className={`font-semibold ${
                          task.status === 'completed'
                            ? 'line-through text-slate-400'
                            : ''
                        }`}
                      >
                        {task.title}
                      </h3>

                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    <p className="text-sm text-slate-500 mt-1">
                      {task.description}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => editTask(task)}
                    >
                      <Edit2 className="w-4 h-4 text-indigo-600" />
                    </button>

                    <button
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingTask
                ? 'Edit Task'
                : 'Create Task'}
            </h2>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Task title"
                className="w-full border p-3 rounded-lg"
                required
              />

              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Description"
                className="w-full border p-3 rounded-lg"
              />

              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full border p-3 rounded-lg"
              >
                <option value="low">Low</option>
                <option value="medium">
                  Medium
                </option>
                <option value="high">High</option>
              </select>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
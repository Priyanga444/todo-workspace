import { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, getAuthToken } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Auth bootstrap
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const userData = await api.getMe();
          setUser(userData);
          // Fetch initial projects
          const userProjects = await api.getProjects();
          setProjects(userProjects);
          if (userProjects.length > 0) {
            try {
              const fullProj = await api.getProject(userProjects[0].id);
              setCurrentProject(fullProj);
            } catch {
              setCurrentProject(userProjects[0]);
            }
          }
        } catch (err) {
          console.error("Token verification failed", err);
          setAuthToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const workspaceMode = user?.workspace_mode || 'team';

  const setWorkspaceMode = async (mode) => {
    try {
      const updatedUser = await api.updateProfile({ workspace_mode: mode });
      setUser(updatedUser);
    } catch (err) {
      console.error('Failed to save workspace mode preference:', err);
    }
  };

  // Theme setup
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    setUser(data.user);
    setAuthToken(data.token);
    
    // Fetch user projects
    const userProjects = await api.getProjects();
    setProjects(userProjects);
    if (userProjects.length > 0) {
      try {
        const fullProj = await api.getProject(userProjects[0].id);
        setCurrentProject(fullProj);
      } catch {
        setCurrentProject(userProjects[0]);
      }
    }
    return data;
  };

  const verifyOtp = async (email, otp) => {
    const data = await api.verifyOtp({ email, otp });
    setUser(data.user);
    setAuthToken(data.token);
    
    // Fetch user projects
    const userProjects = await api.getProjects();
    setProjects(userProjects);
    if (userProjects.length > 0) {
      try {
        const fullProj = await api.getProject(userProjects[0].id);
        setCurrentProject(fullProj);
      } catch {
        setCurrentProject(userProjects[0]);
      }
    }
    return data;
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    setProjects([]);
    setCurrentProject(null);
    setNotifications([]);
  };

  const register = async (name, email, password) => {
    const data = await api.register({ name, email, password });
    return data; // returns requiresOtp: true, email
  };

  const forgotPassword = async (email) => {
    const data = await api.forgotPassword({ email });
    return data;
  };

  const resetPassword = async (email, otp, newPassword) => {
    const data = await api.resetPassword({ email, otp, newPassword });
    return data;
  };

  const selectProject = async (project) => {
    if (!project) {
      setCurrentProject(null);
      return;
    }
    try {
      const fullProj = await api.getProject(project.id);
      setCurrentProject(fullProj);
    } catch {
      setCurrentProject(project);
    }
  };

  const refreshProjects = async () => {
    const userProjects = await api.getProjects();
    setProjects(userProjects);
    if (currentProject) {
      const updated = userProjects.find(p => p.id === currentProject.id);
      if (updated) {
        try {
          const fullProj = await api.getProject(updated.id);
          setCurrentProject(fullProj);
        } catch {
          setCurrentProject(updated);
        }
      }
    }
  };

  const fetchNotifications = async () => {
    if (user) {
      const notifs = await api.getNotifications();
      setNotifications(notifs);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        projects,
        currentProject,
        notifications,
        loading,
        darkMode,
        setDarkMode,
        login,
        verifyOtp,
        logout,
        register,
        forgotPassword,
        resetPassword,
        selectProject,
        refreshProjects,
        fetchNotifications,
        setUser,
        workspaceMode,
        setWorkspaceMode
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

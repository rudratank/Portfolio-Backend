export const isAdminPath = (path) => {
    // Strip the host and api prefix if present to get relative path
    const relativePath = path.replace(/^https?:\/\/[^\/]+/, '').replace(/^\/api/, '');
    
    const adminPaths = [
      '/auth/admin-auth',
      '/home/get-data',
      '/home/update-home',
      '/about/get-about',
      '/about/update-about',
      '/education',
      '/project/get-project',
      '/project/addProject',
      '/project/update-project',
      '/project/delete-project',
      '/certificate/add-certificate',
      '/certificate/get-certificate',
      '/certificate/edit-certificate',
      '/certificate/delete-certificate',
      '/messages/make-message',
      '/messages/get-messages',
      '/messages/edit-messages',
      '/messages/delete-message',
      '/dashboard/stats',
      '/skills'
    ];
  
    // Also check for common admin-related paths
    const commonAdminPaths = [
      '/admin',
      '/dashboard',
      '/login',
      '/api/auth',
      '/api/admin'
    ];
  
    return adminPaths.some(adminPath => relativePath.startsWith(adminPath)) ||
           commonAdminPaths.some(adminPath => path.startsWith(adminPath));
  };
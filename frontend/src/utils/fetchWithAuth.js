export async function fetchWithAuth(url, options = {}) {
    const access = localStorage.getItem('access');
    const refresh = localStorage.getItem('refresh');

    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `JWT ${access}`,
        'Content-Type': 'application/json',
      },
    });
  
    if (response.status === 401 && refresh) {
      const refreshResponse = await fetch('http://localhost:8000/api/v1/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
  
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        localStorage.setItem('access', data.access);
  
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `JWT ${data.access}`,
            'Content-Type': 'application/json',
          },
        });
      } else {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        localStorage.removeItem('username');
        window.location.href = '/login';
      }
    }
  
    return response;
  }
  
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useMemo } from 'react';

const useAuthAxios = () => {
    const { user } = useAuth();

    // useMemo ensures this 'api' object is not re-created on every render,
    // unless the user's token changes.
    const api = useMemo(() => {
        const instance = axios.create({
            baseURL: 'http://localhost:5001/api',
        });

        // This "interceptor" adds the auth token to every single request
        // made with this 'api' instance.
        instance.interceptors.request.use(
            (config) => {
                if (user?.token) {
                    config.headers.Authorization = `Bearer ${user.token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        return instance;
    }, [user]); // Dependency array

    return api;
};

export default useAuthAxios;
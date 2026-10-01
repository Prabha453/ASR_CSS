import axios from "axios";
import { api } from "../config";
import { expireAuthSession } from "./auth_session";

// Base server URL (no db name): http://localhost:5001
const BASE_SERVER = api.API_URL;

// Build full API base URL using the portName stored after login
const buildApiBaseURL = () => {
  const portName = localStorage.getItem("portName");
  return portName ? `${BASE_SERVER}/${portName}` : BASE_SERVER;
};

// Set once at module load (handles page refresh when already logged in)
axios.defaults.baseURL = buildApiBaseURL();

// content type
axios.defaults.headers.post["Content-Type"] = "application/json";

// content type
const token = JSON.parse(localStorage.getItem("authUser")) ? JSON.parse(localStorage.getItem("authUser")).token : null;
if (token)
  axios.defaults.headers.common["Authorization"] = "Bearer " + token;

// intercepting to capture errors
axios.interceptors.response.use(
  function (response) {
    return response.data ? response.data : response;
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    const backendMessage = error?.response?.data?.message;
    const status = error?.response?.status ?? error?.status;
    if (status === 401 && localStorage.getItem("authUser")) {
      delete axios.defaults.headers.common["Authorization"];
      expireAuthSession();
    }
    let message;
    switch (status) {
      case 500:
        message = "Internal Server Error";
        break;
      case 401:
        message = backendMessage || "Your session has expired. Please log in again.";
        break;
      case 404:
        message = backendMessage || "Sorry! the data you are looking for could not be found";
        break;
      case 400:
        message = backendMessage || "Bad request";   // ✅ handles your validation errors
        break;
      default:
        message = backendMessage || error.message || "Something went wrong";
    }
    return Promise.reject(message);
  }
);
/**
 * Sets the default authorization
 * @param {*} token
 */
const setAuthorization = (token) => {
  axios.defaults.headers.common["Authorization"] = "Bearer " + token;
};

/**
 * Updates the axios baseURL to point to the resolved port's database.
 * Called after port resolution at login, and stored in localStorage so
 * page refreshes reconstruct the correct base URL via buildApiBaseURL().
 */
const setApiBaseURL = (portName) => {
  localStorage.setItem("portName", portName);
  axios.defaults.baseURL = `${BASE_SERVER}/${portName}`;
};

class APIClient {
  /**
   * Fetches data from given url
   */

  //  get = (url, params) => {
  //   return axios.get(url, params);
  // };
  get = (url, params) => {
    let response;

    let paramKeys = [];

    if (params) {
      Object.keys(params).map(key => {
        paramKeys.push(key + '=' + params[key]);
        return paramKeys;
      });

      const queryString = paramKeys && paramKeys.length ? paramKeys.join('&') : "";
      response = axios.get(`${url}?${queryString}`, params);
    } else {
      response = axios.get(`${url}`, params);
    }

    return response;
  };
  getBlob = (url) => axios.get(url, { responseType: 'blob' });
  createBlob = (url, data) => axios.post(url, data, { responseType: 'blob' });
  /**
   * post given data to url
   */
  create = (url, data, config = {}) => {
    return axios.post(url, data, config);
  };
  /**
   * Updates data
   */
  update = (url, data, config = {}) => {
    return axios.patch(url, data, config);
  };

  put = (url, data, config = {}) => {
    return axios.put(url, data , config);
  };
  /**
   * Delete
   */
  delete = (url, config) => {
    return axios.delete(url, { ...config });
  };
}
const getLoggedinUser = () => {
  const user = localStorage.getItem("authUser");
  if (!user) {
    return null;
  } else {
    return JSON.parse(user);
  }
};

export { APIClient, setAuthorization, setApiBaseURL, getLoggedinUser };

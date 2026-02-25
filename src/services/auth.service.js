import axios from "axios";

const API = "http://localhost:5000/api/auth";

export const loginUser = (data) => {
  return axios.post(`${API}/login`, data, {
    withCredentials: true
  });
};

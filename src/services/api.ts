import axios from "axios";

const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

export const api = axios.create({
    baseURL: 'https://api.clarifai.com',
    headers: {
        "Authorization": `Key ${API_KEY}`,
        "Content-Type": "application/json"
    }
}
)
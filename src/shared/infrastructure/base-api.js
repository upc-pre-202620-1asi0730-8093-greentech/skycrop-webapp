import axios from "axios";

const platformUrl = import.meta.env.VITE_SKYCROP_API_URL;

export class BaseApi{
    #http;

    constructor() {
        this.#http = axios.create({
            baseURL: platformUrl,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        })
    }

    get http(){
        return this.#http;
    }

}


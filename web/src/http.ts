import axios from "axios";
import {isProdEnv} from "./env";

export const URL_PREFIX = {
    DEV: '/api/',
    PROD: '/'
}

const http = axios.create({
    baseURL: isProdEnv ? URL_PREFIX.PROD : URL_PREFIX.DEV,
    timeout: 10000,
})

export default http
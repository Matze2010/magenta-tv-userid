import { randomBytes, createHash } from "crypto";
import { stringify } from 'qs';
import UnexpectedResponseError from "./error";

import axios from 'axios';
axios.defaults.headers.common['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36'

class MagentaBackend {

    constructor(username, password) {
        this.APP_URL = 'https://web.magentatv.de'
        this.cnonce = randomBytes(16).toString("hex");
        this.username = username;
        this.password = password;

        this.oAuthScope = "ngtvepg";
        this.oAuthServiceURL = "https://accounts.login.idm.telekom.com";
        this.accessToken = null;
        this.userID = null;
    }

    /*
    async loginPhase() {

        this.oAuthScope = null;
        this.oAuthServiceURL = null;
        
        const response = await axios.post(`${this.APP_URL}/EPG/JSON/Login?&T=Mac_chrome_81`, {
            userId: "Guest",
            mac: "00:00:00:00:00:00"
        });

        if (response.status == 200 && response.data.sam3Para) {

            var metadata = response.data.sam3Para.reduce(function (acc, obj) {
                acc[obj.key] = obj.value
                return acc
            }, {})

            if (Object.keys(metadata).includes('SAM3ServiceURL')) {
                this.oAuthServiceURL = metadata['SAM3ServiceURL'];
            }

            if (Object.keys(metadata).includes('OAuthScope')) {
                this.oAuthScope = metadata['OAuthScope'];
            }

            if (this.oAuthServiceURL && this.oAuthScope) {
                return
            }
        } 
        
        throw new UnexpectedResponseError(response);
    }
    */

    /*
    async authenticatePhase() {
       const response = await axios.post(`${this.APP_URL}/EPG/JSON/Authenticate?SID=firstup&T=Mac_chrome_81`, {
            preSharedKeyID: "PC01P00002",
            utcEnable: 1, 
            mac: "00:00:00:00:00:00",
            userType: 3, 
            terminalvendor: "Unknown", 
            cnonce: this.cnonce, 
            terminalid: "00:00:00:00:00:00", 
            terminaltype: "MACWEBTV", 
            timezone: "Europe/Berlin"
        });

        if (response.status != 200 || response.data.retcode != "0") {
            throw new UnexpectedResponseError(response);
        }
    }
    */

    async oAuthPhase() {

        const data = {
            password: this.password,
            scope: `${this.oAuthScope} offline_access`,
            grant_type: 'password',
            username: this.username,
            "x_telekom.access_token.format": 'CompactToken',
            "x_telekom.access_token.encoding": 'text/base64',
            client_id: '10LIVESAM30000004901NGTVWEB0000000000000'
        }

        const data_enocded = stringify(data);

        const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
        const response = await axios.post(`${this.oAuthServiceURL}/oauth2/tokens`, data_enocded, { headers });

        if (response.status != 200 || !response.data.access_token) {
            throw new UnexpectedResponseError(response);
        } else {
            this.accessToken = response.data.access_token;
        }
    }

    async DTAuthenticatePhase() {

        this.userID = null;

        const uuid = 't_' + createHash('md5').update(this.username).digest("hex");
        const response = await axios.post(`${this.APP_URL}/EPG/JSON/DTAuthenticate?SID=user&T=Mac_chrome_81`, { 
            userType: 1, 
            terminalid: uuid, 
            mac: uuid,
            terminaltype: "MACWEBTV", 
            utcEnable: 1, 
            timezone: "Europe/Berlin", 
            terminalDetail: [
                { key: "GUID", value: uuid }, 
                { key: "HardwareSupplier", value: "" }, 
                { key: "DeviceClass", value: "PC" }, 
                { key: "DeviceStorage", value: "1" }, 
                { key: "DeviceStorageSize", value: "" }
            ], 
            softwareVersion: "", 
            osversion: "", 
            terminalvendor: "Unknown", 
            caDeviceInfo: [
                { 
                    "caDeviceType": 6, 
                    "caDeviceId": uuid
                }
            ], 
            accessToken: this.accessToken, 
            preSharedKeyID: "PC01P00002", 
            cnonce: this.cnonce
            }
        );

        if (response.status != 200 || response.data.retcode != "0") {
            throw new UnexpectedResponseError(response);
        }

        this.userID = response.data.userID;
    }

    userData() {
        if (!this.userID) {
            return null;
        }

        return {
            id: this.userID,
            md5: createHash('md5').update(this.userID).digest("hex").toUpperCase()
        }
    }
}

export default MagentaBackend


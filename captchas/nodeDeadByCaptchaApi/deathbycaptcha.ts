import net from 'net';
import FormData from 'form-data';
import fs from 'fs';
import moment from 'moment-timezone';
// API version and unique software ID
const API_VERSION = 'DBC/NodeJS v4.6';

// Base HTTP API url
const HTTP_BASE_URL = 'api.dbcapi.me';

// Preferred HTTP API server's response content type, do not change...!!!
const HTTP_RESPONSE_TYPE = 'application/json';

const TERMINATOR = '\r\n';

// Default CAPTCHA timeout and decode() polling interval
const DEFAULT_TIMEOUT = 60;
const DEFAULT_TOKEN_TIMEOUT = 120;
const POLLS_INTERVAL = [1, 1, 2, 3, 2, 2, 3, 2, 2];
const DFLT_POLL_INTERVAL = 3;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type,@typescript-eslint/typedef
function getRandomInt(min: any, max: any) {
    const a = Math.ceil(min);
    const b = Math.floor(max);
    return Math.floor(Math.random() * (b - a + 1)) + a;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function load_image(image: any) {
    const image_regex = RegExp('.jpg$|.png$|.gif$|.bmp$');
    const b64_regex = RegExp('^base64:');
    if (image_regex.test(image)) {
        return fs.readFileSync(image, { encoding: 'base64' });
    } else if (b64_regex.test(image)) {
        return image.substring(7);
    } else {
        return image.toString('base64');
    }
}

class Client {
    // Death by Captcha API Client.
    userpwd: any;

    constructor(username: any, password: any) {
        if (username === 'authtoken') {
            console.log('using authtoken');
            this.userpwd = {
                username: username,
                authtoken: password,
            };
        } else {
            //console.log('using username/password');
            this.userpwd = {
                username: username,
                password: password,
            };
        }
    }

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type,@typescript-eslint/typedef
    get_balance(cb: any) {
        // Fetch user balance (in US cents).
        //@ts-ignore
        this.get_user((user: any) => {
            cb(user ? user['balance'] : null);
        });
    }

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type,@typescript-eslint/typedef
    get_text(cid: any, cb: any) {
        // Fetch a CAPTCHA text.
        //@ts-ignore
        this.get_captcha(cid, (captcha: any) => {
            cb(captcha ? captcha['text'] : null);
        });
    }

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type,@typescript-eslint/typedef
    decode({ captcha = null, timeout = null, extra = {} }, cb: any) {
        // Try to solve a CAPTCHA.

        // See Client.upload() for arguments details.

        // Uploads a CAPTCHA, polls for its status periodically with arbitrary
        // timeout (in seconds), returns CAPTCHA details if (correctly) solved.

        if (!timeout) {
            if (!captcha) {
                // @ts-ignore
                timeout = DEFAULT_TOKEN_TIMEOUT;
            } else {
                // @ts-ignore
                timeout = DEFAULT_TIMEOUT;
            }
        }
        console.log('1', Number(moment().format('x')));
        // @ts-ignore
        console.log('2', Number(moment().format('x')) + (0 < timeout ? timeout : DEFAULT_TIMEOUT) * 1000);

        // @ts-ignore
        const deadline = Number(moment().format('x')) + (0 < timeout ? timeout : DEFAULT_TIMEOUT) * 1000;
        // @ts-ignore
        this.upload({ captcha: captcha, extra: extra }, (uploaded_captcha: any) => {
            if (uploaded_captcha) {
                const intvl_idx = 0;
                // eslint-disable-next-line @typescript-eslint/explicit-function-return-type,@typescript-eslint/typedef
                (function poll_interval(client, deadline, idx, captcha, cb) {
                    console.log('poll interval captcha:', deadline > Number(moment().format('x')));
                    if (deadline > Number(moment().format('x')) && !captcha['text']) {
                        if (POLLS_INTERVAL.length > idx) {
                            // eslint-disable-next-line no-var
                            var intvl = POLLS_INTERVAL[idx] * 1000;
                        } else {
                            // eslint-disable-next-line no-var
                            var intvl = DFLT_POLL_INTERVAL * 1000;
                        }
                        setTimeout(() => {
                            // @ts-ignore
                            client.get_captcha(captcha['captcha'], (uploaded_captcha: any) => {
                                poll_interval(client, deadline, idx + 1, uploaded_captcha, cb);
                            });
                        }, intvl);
                    } else if (captcha['text'] && captcha['is_correct']) {
                        cb(captcha);
                    } else {
                        cb(null);
                    }
                })(this, deadline, intvl_idx, uploaded_captcha, cb);
            } else {
                cb(null);
            }
        });
    }
}

class HttpClient extends Client {
    // Death by Captcha HTTP API client.

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type,@typescript-eslint/typedef
    _call({ cmd, payload = null, headers = {}, files = null }, cb: any) {
        const form = new FormData();
        // @ts-ignore
        const options = {
            protocol: 'http:',
            host: HTTP_BASE_URL,
            path: '/api/' + cmd,
        };

        if (payload) {
            // @ts-ignore
            for (const entry in payload) {
                // @ts-ignore
                form.append(entry, payload[entry]);
            }
            if (files) {
                // @ts-ignore
                for (const file_key in files) {
                    // @ts-ignore
                    form.append(file_key, files[file_key]);
                }
            }
            // @ts-ignore
            options['headers'] = form.getHeaders();
        } else {
            // @ts-ignore
            options['method'] = 'GET';
            // @ts-ignore
            options['headers'] = headers;
        }
        // @ts-ignore
        options['headers']['Accept'] = HTTP_RESPONSE_TYPE;
        // @ts-ignore
        options['headers']['User-Agent'] = API_VERSION;

        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/typedef
        const request = form.submit(options, (err, response) => {
            if (err) {
                throw new Error(err.message);
            } else {
                switch (response.statusCode) {
                    case 200:
                    case 303:
                        // eslint-disable-next-line no-var
                        var data = '';
                        response.setEncoding('utf8');
                        // eslint-disable-next-line @typescript-eslint/typedef
                        response.on('data', chunk => {
                            data += chunk;
                        });
                        response.on('end', () => {
                            const result = JSON.parse(data);
                            if (cmd == 'user') {
                                cb(result['user'] ? result : { user: 0 });
                            } else if (cmd == 'captcha') {
                                cb(result['captcha'] ? result : null);
                            } else if (cmd.includes('report')) {
                                cb(!result['is_correct']);
                            } else {
                                cb(result['captcha'] ? result : { captcha: 0 });
                            }
                        });
                        break;
                    case 403:
                        throw new Error('Access denied, please check your credentials and/or balance');
                        break;
                    case 400:
                    case 413:
                        throw new Error("CAPTCHA was rejected by the service, check if i's a valid image");
                        break;
                    case 503:
                        throw new Error('CAPTCHA was rejected due to service overload, try again later');
                        break;
                    default:
                        throw new Error('Invalid API response');
                }
            }
        });
    }

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    get_user(cb: any) {
        const params = {
            cmd: 'user',
            payload: this.userpwd,
        };
        this._call(params, cb);
    }

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    get_captcha(cid: any, cb: any) {
        // Fetch a captcha details -- ID, text and correctness flag.
        const params = {
            cmd: 'captcha/' + cid,
        };
        this._call(params, cb);
    }

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    report(cid: any, cb: any) {
        // Report a captcha as incorrectly solved.
        const params = {
            cmd: 'captcha/' + cid + '/report',
            payload: this.userpwd,
        };
        this._call(params, cb);
    }

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type,@typescript-eslint/typedef
    upload({ captcha = null, extra = {} }, cb: any) {
        // Upload a CAPTCHA.

        // Accept file names and file-like objects. Return CAPTCHA details
        // JSON on success.
        // @ts-ignore
        const banner = extra.banner ? extra.banner : null;
        const files = {};
        if (captcha) {
            // @ts-ignore

            files['captchafile'] = 'base64:' + load_image(captcha);
        }
        if (banner) {
            // @ts-ignore

            files['banner'] = 'base64:' + load_image(banner);
        }
        const payload = this.userpwd;
        // @ts-ignore

        for (const entry in extra) {
            // @ts-ignore

            payload[entry] = extra[entry];
        }
        const params = {
            cmd: 'captcha',
            payload: payload,
            files: files,
        };
        // @ts-ignore
        this._call(params, cb);
    }
}

class SocketClient extends Client {
    // Death By Captcha Socket API Client.

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type,@typescript-eslint/typedef
    _call({ cmd, payload = {}, headers = {}, files = null }, cb) {
        // @ts-ignore

        payload['cmd'] = cmd;
        // @ts-ignore

        payload['version'] = API_VERSION;

        const options = {
            host: HTTP_BASE_URL,
            // port: getRandomInt(8123, 8130)
            port: 8123,
        };

        if (files) {
            // @ts-ignore
            for (const file_key in files) {
                // @ts-ignore
                payload[file_key] = files[file_key];
            }
        }

        const request = JSON.stringify(payload) + TERMINATOR;

        let need_login = cmd != 'login';

        const login_request_token =
            JSON.stringify({
                cmd: 'login',
                // @ts-ignore
                authtoken: payload['authtoken'],
            }) + TERMINATOR;

        const login_request =
            JSON.stringify({
                cmd: 'login',
                // @ts-ignore
                username: payload['username'],
                // @ts-ignore
                password: payload['password'],
            }) + TERMINATOR;

        const socket = net.createConnection(options, () => {
            // @ts-ignore
            if (need_login && payload['username'] === 'authtoken') {
                socket.write(login_request_token, 'utf8');
                // @ts-ignore
            } else if (need_login && payload['username'] !== 'authtoken') {
                socket.write(login_request, 'utf8');
            } else {
                socket.write(request, 'utf8');
            }
        });

        socket.on('error', (err: any) => {
            throw new Error(err.message);
        });

        let data = '';
        socket.on('data', (chunk: any) => {
            data += chunk;
            if (data.includes(TERMINATOR)) {
                if (need_login) {
                    need_login = false;
                    data = '';
                    socket.write(request, 'utf8');
                } else {
                    socket.end();
                    try {
                        // @ts-ignore
                        // eslint-disable-next-line no-var
                        var result = JSON.parse(data.trimRight(TERMINATOR));
                    } catch (err) {
                        throw new Error('Invalid API response');
                    }
                    if (result['error']) {
                        if (result['error'] == 'not-logged-in' || result['error'] == 'invalid-credentials') {
                            throw new Error('Access denied, check your credentials');
                        } else if (result['error'] == 'banned') {
                            throw new Error('Access denied, account is suspended');
                        } else if (result['error'] == 'insufficient-funds') {
                            throw new Error('CAPTCHA was rejected due to low balance');
                        } else if (result['error'] == 'invalid-captcha') {
                            throw new Error('CAPTCHA is not a valid image');
                        } else if (result['error'] == 'service-overload') {
                            throw new Error('CAPTCHA was rejected due to service overload, try again later');
                        } else {
                            throw new Error('API server error ocurred: ' + result['error']);
                        }
                    } else {
                        if (cmd == 'user') {
                            cb(result['user'] ? result : { user: 0 });
                        } else if (cmd == 'upload') {
                            cb(result['captcha'] ? result : null);
                        } else if (cmd.includes('report')) {
                            cb(result['is_correct'] ? !result['is_correct'] : null);
                        } else {
                            cb(result['captcha'] ? result : { captcha: 0 });
                        }
                    }
                }
            }
        });
    }

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    get_user(cb: any) {
        // Fetch user details -- ID, balance, rate and banned status.
        const params = {
            cmd: 'user',
            payload: this.userpwd,
        };
        this._call(params, cb);
    }

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    get_captcha(cid: any, cb: any) {
        // Fetch a captcha details -- ID, text and correctness flag.
        const params = {
            cmd: 'captcha',
            payload: {
                captcha: cid,
            },
        };
        this._call(params, cb);
    }

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    report(cid: any, cb: any) {
        // Report a captcha as incorrectly solved.
        const payload = this.userpwd;
        payload['captcha'] = cid;
        const params = {
            cmd: 'report',
            payload: payload,
        };
        this._call(params, cb);
    }

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type,@typescript-eslint/typedef
    upload({ captcha = null, extra = {} }, cb: any) {
        // Upload a CAPTCHA.

        // Accept file names and file-like objects. Return CAPTCHA details
        // JSON on success.
        // @ts-ignore
        const banner = extra.banner ? extra.banner : null;
        const files = {};
        if (captcha) {
            // @ts-ignore
            files['captcha'] = load_image(captcha);
        }
        if (banner) {
            // @ts-ignore
            files['banner'] = load_image(banner);
        }
        const payload = this.userpwd;
        for (const entry in extra) {
            if (entry != 'banner') {
                // @ts-ignore
                payload[entry] = extra[entry];
            }
        }
        const params = {
            cmd: 'upload',
            payload: payload,
            files: files,
        };
        // @ts-ignore
        this._call(params, cb);
    }
}

export default {
    HttpClient: HttpClient,
    SocketClient: SocketClient,
};

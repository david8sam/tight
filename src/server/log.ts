import chalk from 'chalk';
import { format } from 'date-fns';
import util from 'util';

import { MessageType } from 'common/message.js';

const isDev = process.env.NODE_ENV === 'development';
if (isDev) {
    util.inspect.defaultOptions.depth = null;
}

function formatTime() {
    return chalk.grey(`[${format(Date.now(), 'HH:mm:ss')}]`);
}

/**
 * Log a Web Socket message being received or sent.
 */
export function logWS(send: boolean, id: string, payload: { type: MessageType; data: any; error?: any }) {
    let message = chalk.cyan(send ? 'Sending' : 'Receiving');
    const toFrom = `${send ? ' to ' : ' from '}`;
    message = `${message}${toFrom}${chalk.blueBright(id)}`;

    const { type, data } = payload;
    const typeMsg = chalk.magenta(MessageType[type]);

    let logData = '';
    if (data) {
        if (!send) {
            logData = isDev ? data : chalk.green(JSON.stringify(data));
        } else if (isDev) {
            logData = process.env.LOG_LEVEL === 'debug' ? data : Object.keys(data);
        }

        if (typeof logData !== 'string' && Object.keys(data).length === 0) {
            logData = '';
        }
    }

    console.log(`${formatTime()} ${message} ${typeMsg}${isDev && logData ? '\n' : ''}`, logData);
}

export function logDebug(message: string, ...data: any[]) {
    if (isDev) {
        console.log(`${formatTime()} ${message}`, ...data);
    }
}

/**
 * Log a general message.
 */
export default function log(message: string, ...data: any[]) {
    console.log(`${formatTime()} ${message}`, ...data);
}

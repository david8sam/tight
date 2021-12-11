import chalk from 'chalk';
import moment from 'moment';

import { MessageType } from 'common/message';

const util = require('util');
const isDev = process.env.NODE_ENV === 'development';
if (isDev) {
    util.inspect.defaultOptions.depth = null;
}

function formatTime() {
    return chalk.grey(`[${moment(Date.now()).format('HH:mm:ss')}]`);
}

/**
 * Log a Web Socket message being received or sent.
 */
export function logWS(
    send: boolean,
    accountId: string | string[] | null | undefined,
    payload: { type: MessageType; data: any; error?: any },
) {
    let message = chalk.cyan(send ? 'Sending' : 'Receiving');
    const accountIdsMessage = Array.isArray(accountId) ? accountId.join() : accountId;
    if (accountIdsMessage) {
        const toFrom = `${send ? ' to ' : ' from '}`;
        message = `${message}${toFrom}${chalk.blueBright(accountIdsMessage)}`;
    }

    const { type, data } = payload;
    const typeMsg = chalk.magenta(type);

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

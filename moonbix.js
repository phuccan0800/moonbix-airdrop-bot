const fs = require('fs');
const path = require('path');
const axios = require('axios');
const colors = require('colors');
const { HttpsProxyAgent } = require('https-proxy-agent');
const crypto = require("crypto");


class Binance {
    constructor(index) {
        this.headers = {
            "Accept": "*/*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
            "Content-Type": "application/json",
            "Origin": "https://www.binance.com",
            "Referer": "https://www.binance.com/vi/game/tg/moon-bix",
            "Sec-Ch-Ua": '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "User-Agent": this.getRandomAndroidUserAgent()
        };
        this.index = index;
        this.game_response = null;
        this.game = null;
    }

    getRandomAndroidUserAgent() {
        const androidUserAgents = [
            "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36",
            "Mozilla/5.0 (Linux; Android 11; Pixel 4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Mobile Safari/537.36",
            "Mozilla/5.0 (Linux; Android 12; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.62 Mobile Safari/537.36",
            "Mozilla/5.0 (Linux; Android 11; OnePlus 9 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.164 Mobile Safari/537.36",
            "Mozilla/5.0 (Linux; Android 10; Redmi Note 9 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36"
        ];
        return androidUserAgents[Math.floor(Math.random() * androidUserAgents.length)];
    }

    log(msg, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        switch (type) {
            case 'success':
                console.log(`[${timestamp}] [Account ${this.index}] ${msg}`.green);
                break;
            case 'custom':
                console.log(`[${timestamp}] [Account ${this.index}] ${msg}`.magenta);
                break;
            case 'error':
                console.log(`[${timestamp}] [Account ${this.index}] ${msg}`.red);
                break;
            case 'warning':
                console.log(`[${timestamp}] [Account ${this.index}] ${msg}`.yellow);
                break;
            default:
                console.log(`[${timestamp}] [Account ${this.index}] ${msg}`);
        }
    }

    async countdown(seconds) {
        this.log(`Wait ${seconds} seconds to continue...`, 'custom');
        for (let i = seconds; i > 0; i--) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    async callBinanceAPI(queryString) {
        const accessTokenUrl = "https://www.binance.com/bapi/growth/v1/friendly/growth-paas/third-party/access/accessToken";
        const userInfoUrl = "https://www.binance.com/bapi/growth/v1/friendly/growth-paas/mini-app-activity/third-party/user/user-info";

        try {
            const accessTokenResponse = await this.axios.post(accessTokenUrl, {
                queryString: queryString,
                socialType: "telegram"
            });

            if (accessTokenResponse.data.code !== "000000" || !accessTokenResponse.data.success) {
                throw new Error(`Failed to get access token: ${accessTokenResponse.data.message}`);
            }

            const accessToken = accessTokenResponse.data.data.accessToken;
            const userInfoHeaders = {
                ...this.headers,
                "X-Growth-Token": accessToken
            };

            const userInfoResponse = await this.axios.post(userInfoUrl, {
                resourceId: 2056
            }, { headers: userInfoHeaders });

            if (userInfoResponse.data.code !== "000000" || !userInfoResponse.data.success) {
                throw new Error(`Failed to get user info: ${userInfoResponse.data.message}`);
            }

            return { userInfo: userInfoResponse.data.data, accessToken };
        } catch (error) {
            this.log(`API call failed: ${error.message}`, 'error');
            return null;
        }
    }

    async startGame(accessToken) {
        try {
            const response = await this.axios.post(
                'https://www.binance.com/bapi/growth/v1/friendly/growth-paas/mini-app-activity/third-party/game/start',
                { resourceId: 2056 },
                { headers: { ...this.headers, "X-Growth-Token": accessToken } }
            );

            this.game_response = response.data;
            if (response.data.code === '000000') {
                this.log("Start Game", 'success');
                return true;
            }

            if (response.data.code === '116002') {
                this.log("Not enough to play!", 'warning');
            } else {
                this.log("Error Starting Game!", 'error');
            }

            return false;
        } catch (error) {
            this.log(`Can't Start Game:: ${error.message}`, 'error');
            return false;
        }
    }

    encrypt(text, key) {
        const iv = crypto.randomBytes(12);
        const ivBase64 = iv.toString("base64");
        const cipher = crypto.createCipheriv(
            "aes-256-cbc",
            Buffer.from(key),
            ivBase64.slice(0, 16)
        );
        let encrypted = cipher.update(text, "utf8", "base64");
        encrypted += cipher.final("base64");
        return ivBase64 + encrypted;
    }


    async gameData() {
        try {
            const startTime = Date.now();
            const endTime = startTime + 50000;
            const gameTag = this.game_response.data.gameTag;
            const itemSettings =
                this.game_response.data.cryptoMinerConfig.itemSettingList;

            let currentTime = startTime;
            let score = 100;
            const gameEvents = [];

            while (currentTime < endTime) {
                const timeIncrement =
                    Math.floor(Math.random() * (2500 - 1500 + 1)) + 1500;
                currentTime += timeIncrement;

                if (currentTime >= endTime) break;

                const hookPosX = (Math.random() * (275 - 75) + 75).toFixed(3);
                const hookPosY = (Math.random() * (251 - 199) + 199).toFixed(3);
                const hookShotAngle = (Math.random() * 2 - 1).toFixed(3);
                const hookHitX = (Math.random() * (400 - 100) + 100).toFixed(3);
                const hookHitY = (Math.random() * (700 - 250) + 250).toFixed(3);

                let itemType, itemSize, points;

                const randomValue = Math.random();
                if (randomValue < 0.6) {
                    const rewardItems = itemSettings.filter(
                        (item) => item.type === "REWARD"
                    );
                    const selectedReward =
                        rewardItems[Math.floor(Math.random() * rewardItems.length)];
                    itemType = 1;
                    itemSize = selectedReward.size;
                    points = Math.min(selectedReward.rewardValueList[0], 10);
                    score = Math.min(score + points, 200);
                } else if (randomValue < 0.8) {
                    const trapItems = itemSettings.filter((item) => item.type === "TRAP");
                    const selectedTrap =
                        trapItems[Math.floor(Math.random() * trapItems.length)];
                    itemType = 1;
                    itemSize = selectedTrap.size;
                    points = Math.min(Math.abs(selectedTrap.rewardValueList[0]), 20);
                    score = Math.max(100, score - points);
                } else {
                    const bonusItem = itemSettings.find((item) => item.type === "BONUS");
                    if (bonusItem) {
                        itemType = 2;
                        itemSize = bonusItem.size;
                        points = Math.min(bonusItem.rewardValueList[0], 15);
                        score = Math.min(score + points, 200);
                    } else {
                        itemType = 0;
                        itemSize = 0;
                        points = 0;
                    }
                }

                const eventData = `${currentTime}|${hookPosX}|${hookPosY}|${hookShotAngle}|${hookHitX}|${hookHitY}|${itemType}|${itemSize}|${points}`;
                gameEvents.push(eventData);
            }

            const payload = gameEvents.join(";");
            const encryptedPayload = this.encrypt(payload, gameTag);

            this.game = {
                payload: encryptedPayload,
                log: score,
            };

            return true;
        } catch (error) {
            this.log(`Error in getGameData: ${error.message}`, "error");
            this.game = null;
            return false;
        }
    }

    async completeGame(accessToken) {
        try {
            const response = await this.axios.post(
                'https://www.binance.com/bapi/growth/v1/friendly/growth-paas/mini-app-activity/third-party/game/complete',
                {
                    resourceId: 2056,
                    payload: this.game.payload,
                    log: this.game.log
                },
                { headers: { ...this.headers, "X-Growth-Token": accessToken } }
            );

            if (response.data.code === '000000' && response.data.success) {
                this.log(`Complete! => ${this.game.log} points`, 'success');
                return true;
            }

            this.log(`Can't Finish Game: ${response.data.message}`, 'error');
            return false;
        } catch (error) {
            this.log(`Error while completing the game: ${error.message}`, 'error');
            return false;
        }
    }

    async getTaskList(accessToken) {
        const taskListUrl = "https://www.binance.com/bapi/growth/v1/friendly/growth-paas/mini-app-activity/third-party/task/list";
        try {
            const response = await this.axios.post(taskListUrl, {
                resourceId: 2056
            }, {
                headers: {
                    ...this.headers,
                    "X-Growth-Token": accessToken
                }
            });

            if (response.data.code !== "000000" || !response.data.success) {
                throw new Error(`Unable to retrieve mission list: ${response.data.message}`);
            }

            const taskList = response.data.data.data[0].taskList.data;
            const resourceIds = taskList
                .filter(task => task.completedCount === 0)
                .map(task => task.resourceId);

            return resourceIds;
        } catch (error) {
            this.log(`Unable to fetch mission list: ${error.message}`, 'error');
            return null;
        }
    }

    async completeTask(accessToken, resourceId) {
        const completeTaskUrl = "https://www.binance.com/bapi/growth/v1/friendly/growth-paas/mini-app-activity/third-party/task/complete";
        try {
            const response = await this.axios.post(completeTaskUrl, {
                resourceIdList: [resourceId],
                referralCode: null
            }, {
                headers: {
                    ...this.headers,
                    "X-Growth-Token": accessToken
                }
            });

            if (response.data.code !== "000000" || !response.data.success) {
                throw new Error(`Unable to complete task: ${response.data.message}`);
            }

            if (response.data.data.type) {
                this.log(`Task ${response.data.data.type} finished!`, 'success');
            }

            return true;
        } catch (error) {
            this.log(`Unable to complete task: ${error.message}`, 'error');
            return false;
        }
    }

    async completeTasks(accessToken) {
        const resourceIds = await this.getTaskList(accessToken);
        if (!resourceIds || resourceIds.length === 0) {
            this.log("There is no unfinished task", 'info');
            return;
        }

        for (const resourceId of resourceIds) {
            if (resourceId !== 2058) {
                const success = await this.completeTask(accessToken, resourceId);
                if (success) {
                    this.log(`Have completed the task: ${resourceId}`, 'success');
                } else {
                    this.log(`Unable to complete task: ${resourceId}`, 'warning');
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    async playGameIfTicketsAvailable(queryString, proxyAgent) {
        const result = await this.callBinanceAPI(queryString);
        if (!result) return;
        const { userInfo, accessToken } = result;
        const totalGrade = userInfo.metaInfo.totalGrade;
        let availableTickets = userInfo.metaInfo.totalAttempts - userInfo.metaInfo.consumedAttempts;
        this.log(`Score: ${totalGrade}`, 'info');
        while (availableTickets > 0) {
            this.log(`Score: ${totalGrade} | Tickets : ${availableTickets}`, 'info');
            if (await this.startGame(accessToken)) {
                if (await this.gameData(proxyAgent)) {
                    await this.countdown(50);

                    if (await this.completeGame(accessToken)) {
                        availableTickets--;
                        this.log(`Remaining tickets: ${availableTickets}`, 'info');
                    } else {
                        break;
                    }
                } else {
                    this.log("Unable to receive game data", 'error');
                    break;
                }
            } else {
                this.log("Can't Start Game", 'error');
                break;
            }

            if (availableTickets > 0) {
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        if (availableTickets === 0) {
            this.log("Tickets Sold Out Boss", 'success');
            return userInfo.metaInfo.attemptRefreshCountDownTime;
        }
    }

    async main(queryString, proxy) {
        const proxyAgent = new HttpsProxyAgent(proxy);
        this.axios = axios.create({ headers: this.headers, httpsAgent: proxyAgent });
        while (true) {
            const userData = JSON.parse(decodeURIComponent(queryString.split('user=')[1].split('&')[0]));
            const timeSleep = await this.playGameIfTicketsAvailable(queryString, proxyAgent);
            if (timeSleep) {
                await this.countdown(timeSleep / 1000);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));

        }
    }
}

async function encrypt(text, key) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const iv_base64 = btoa(String.fromCharCode(...iv));
    const iv16 = iv_base64.substring(0, 16);

    const encoder = new TextEncoder();
    const encodedKey = encoder.encode(key);
    const encodedText = encoder.encode(text);

    const cipher = await window.crypto.subtle.encrypt(
        { name: "AES-CBC", iv: encoder.encode(iv16) },
        await window.crypto.subtle.importKey("raw", encodedKey, "AES-CBC", false, ["encrypt"]),
        encodedText
    );

    const ciphertext_base64 = btoa(String.fromCharCode(...new Uint8Array(cipher)));
    return iv_base64 + ciphertext_base64;
}

function randomKeyFromObject(obj) {
    let keys = Object.keys(obj);
    return keys[Math.floor(Math.random() * keys.length)];
}

const dataFile = path.join(__dirname, 'data.txt');
const data = fs.readFileSync(dataFile, 'utf8').replace(/\r/g, '').split('\n').filter(Boolean);
const proxyFile = path.join(__dirname, 'proxy.txt');
const proxy = fs.readFileSync(proxyFile, 'utf8').replace(/\r/g, '').split('\n').filter(Boolean);

if (data.length === 0) {
    console.log('Please provide data in data.txt file');
    process.exit(1);
}

if (proxy.length === 0) {
    console.log('Please provide proxy in proxy.txt file');
    process.exit(1);
}

if (data.length > proxy.length) {
    console.log('Data and proxy must have the same length');
    process.exit(1);
}

const promises = [];
process.stdout.write('\x1Bc');
console.log();
for (let i = 0; i < data.length; i++) {
    const proxyUse = `http://${proxy[i].split(':')[2]}:${proxy[i].split(':')[3]}@${proxy[i].split(':')[0]}:${proxy[i].split(':')[1]}`;
    promises.push(new Binance(i + 1).main(data[i], proxyUse));
}
"use strict";

const axios = require("axios");

/**
 * @name 全豆要聚合音源插件
 * @version 0.5.0
 * @author 全豆要 & Gemini
 * @description 适配 MusicFree 框架，集成星海/溯音/长青/念心等多链路自动回退
 */

// --- 接口配置 ---
const XINGHAI_API = "https://music-api.gdstudio.xyz/api.php?use_xbridge3=true&loader_name=forest&need_sec_link=1&sec_link_scene=im";
const CHANGQING_BASE = "http://175.27.166.236";
const NIANXIN_BASE = "https://music.nxinxz.com";

// 音质映射 (MusicFree quality -> 各接口参数)
const qualityMap = {
    low: { xing: "128", cq: "standard", nx: "128k" },
    standard: { xing: "320", cq: "standard", nx: "320k" },
    high: { xing: "320", cq: "lossless", nx: "flac" },
    super: { xing: "740", cq: "lossless", nx: "flac" },
};

// 平台映射 (MusicFree 内部平台名 -> 接口参数)
const platformMap = {
    tx: { xing: "tencent", cq: "tx", nx: "tx" },
    wy: { xing: "netease", cq: "wy", nx: "wy" },
    kw: { xing: "kuwo", cq: "kw", nx: "kw" },
    kg: { xing: "kugou", cq: "kg", nx: "kg" },
    mg: { xing: "migu", cq: "mg", nx: "mg" }
};

// --- 核心获取逻辑 ---

/**
 * 核心：多链路获取URL
 */
async function getUrlFromAllSources(musicItem, quality) {
    const platform = musicItem.platform || 'tx'; // 默认为QQ
    const mapping = platformMap[platform] || platformMap['tx'];
    const qCfg = qualityMap[quality] || qualityMap['standard'];
    const songId = musicItem.songmid || musicItem.id;

    // 链路1：星海主接口
    try {
        const res = await axios.get(`${XINGHAI_API}&types=url&source=${mapping.xing}&id=${songId}&br=${qCfg.xing}`);
        if (res.data && res.data.url && res.data.url.startsWith('http')) {
            return res.data.url;
        }
    } catch (e) {}

    // 链路2：长青 SVIP 模板
    try {
        let cqUrl = "";
        if (mapping.cq === 'wy') cqUrl = `${CHANGQING_BASE}/wy/wy.php?type=mp3&id=${songId}&level=${qCfg.cq}`;
        else if (mapping.cq === 'tx') cqUrl = `${CHANGQING_BASE}/kgqq/qq.php?type=mp3&id=${songId}&level=${qCfg.cq}`;
        else if (mapping.cq === 'kw') cqUrl = `https://musicapi.haitangw.net/music/kw.php?type=mp3&id=${songId}&level=${qCfg.cq}`;
        
        if (cqUrl) {
            const res = await axios.get(cqUrl);
            if (typeof res.data === 'string' && res.data.startsWith('http')) return res.data;
            if (res.data && res.data.url) return res.data.url;
        }
    } catch (e) {}

    // 链路3：念心 SVIP 模板
    try {
        let nxUrl = "";
        const level = qCfg.cq; // 使用长青的level逻辑
        if (mapping.nx === 'wy') nxUrl = `${NIANXIN_BASE}/wy.php?id=${songId}&level=${level}&type=mp3`;
        else if (mapping.nx === 'tx') nxUrl = `${NIANXIN_BASE}/kgqq/tx.php?id=${songId}&level=${level}&type=mp3`;
        else if (mapping.nx === 'kw') nxUrl = `${NIANXIN_BASE}/kw.php?id=${songId}&level=${level}&type=mp3`;

        if (nxUrl) {
            const res = await axios.get(nxUrl);
            if (res.data && res.data.url) return res.data.url;
        }
    } catch (e) {}

    throw new Error("所有解析链路均已失效");
}

// --- 插件导出接口 ---

module.exports = {
    platform: "全豆要聚合",
    author: "全豆要 & Gemini",
    version: "0.5.0",
    srcUrl: "", // 可填写你的托管地址
    cacheControl: "no-cache",
    
    primaryKey: ["id", "songmid"],
    
    /**
     * 获取媒体源
     */
    async getMediaSource(musicItem, quality) {
        const url = await getUrlFromAllSources(musicItem, quality);
        return {
            url: url,
        };
    },

    /**
     * 搜索逻辑 (这里复用 xiaoqiu.js 的搜索框架，你可以按需修改)
     * 注意：由于 MusicFree 的搜索依赖于具体平台的 API，这里建议保持各平台独立搜索，仅在播放时聚合。
     */
    async search(query, page, type) {
        // 此处建议使用 MusicFree 的各平台插件进行搜索
        // 若需在此插件实现搜索，可参考 xiaoqiu.js 原有的 searchBase 逻辑实现 QQ/网易搜索
        return {
            isEnd: true,
            data: []
        };
    },
};

/**
 * @name 全豆要聚合音源
 * @version 5.0.0
 * @author iamcool666
 * @description 适配MusicFree，聚合星海/长青/念心/汽水多链路回退
 */

const { axios } = require("@musicfree/util");

// --- 接口常量定义 ---
const XINGHAI_API = "https://music-api.gdstudio.xyz/api.php?use_xbridge3=true&loader_name=forest&need_sec_link=1&sec_link_scene=im";
const CHANGQING_BASE = "http://175.27.166.236";
const NIANXIN_BASE = "https://music.nxinxz.com";
const QISHUI_API = "https://api.vsaa.cn/api/music.qishui.vip";

// 平台映射
const PLATFORM_MAP = {
    'netease': { xing: 'netease', cq: 'wy', nx: 'wy' },
    'tencent': { xing: 'tencent', cq: 'tx', nx: 'tx' },
    'kuwo': { xing: 'kuwo', cq: 'kw', nx: 'kw' },
    'kugou': { xing: 'kugou', cq: 'kg', nx: 'kg' },
    'migu': { xing: 'migu', cq: 'mg', nx: 'mg' }
};

/**
 * 搜索功能（使用汽水音源作为搜索入口）
 */
async function search(keyword, page, type) {
    if (type !== 'music') return null;
    try {
        const res = await axios.get(QISHUI_API, {
            params: { act: "search", keywords: keyword, page: page, pagesize: 20, type: "music" }
        });
        const list = res.data?.data?.lists || [];
        return {
            isEnd: list.length < 20,
            data: list.map(item => ({
                id: item.id || item.vid,
                name: item.name,
                artist: item.artists,
                album: item.album,
                img: item.cover || item.pic,
                // 默认将搜索结果归类到网易云逻辑进行解析，或根据接口返回调整
                platform: "netease" 
            }))
        };
    } catch (e) {
        return null;
    }
}

/**
 * 核心播放源获取（多链路自动回退逻辑）
 */
async function getMediaSource(item, quality) {
    const platform = item.platform || 'netease';
    const mapping = PLATFORM_MAP[platform] || PLATFORM_MAP['netease'];
    const id = item.id;

    // 音质参数处理
    const brMap = { 'low': '128', 'standard': '320', 'high': '320', 'super': '740' };
    const level = quality === 'low' ? 'standard' : 'lossless';

    // 1. 尝试星海接口
    try {
        const res = await axios.get(`${XINGHAI_API}&types=url&source=${mapping.xing}&id=${id}&br=${brMap[quality] || '128'}`);
        if (res.data?.url) return { url: res.data.url };
    } catch (e) {}

    // 2. 尝试长青接口
    try {
        let cqUrl = mapping.cq === 'wy' 
            ? `${CHANGQING_BASE}/wy/wy.php?type=mp3&id=${id}&level=${level}`
            : `${CHANGQING_BASE}/kgqq/qq.php?type=mp3&id=${id}&level=${level}`;
        const res = await axios.get(cqUrl);
        if (res.data?.url) return { url: res.data.url };
        if (typeof res.data === 'string' && res.data.startsWith('http')) return { url: res.data };
    } catch (e) {}

    // 3. 尝试念心接口
    try {
        let nxUrl = mapping.nx === 'wy'
            ? `${NIANXIN_BASE}/wy.php?id=${id}&level=${level}&type=mp3`
            : `${NIANXIN_BASE}/kgqq/tx.php?id=${id}&level=${level}&type=mp3`;
        const res = await axios.get(nxUrl);
        if (res.data?.url) return { url: res.data.url };
    } catch (e) {}

    return null;
}

/**
 * 歌词获取
 */
async function getLyric(item) {
    try {
        const res = await axios.get(QISHUI_API, {
            params: { act: "song", id: item.id }
        });
        const data = res.data?.data?.[0] || res.data?.data;
        return { lyric: data?.lyric || "" };
    } catch (e) {
        return null;
    }
}

// 导出 MusicFree 插件
module.exports = {
    platform: "全豆要聚合",
    version: "5.0.0",
    order: 1,
    search,
    getMediaSource,
    getLyric
};

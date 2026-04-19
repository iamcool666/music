/**
 * @name 全豆要聚合音源
 * @author iamcool666
 * @version 5.5.0
 */

const { axios } = require("@musicfree/util");

const APIS = {
    xinghai: "https://music-api.gdstudio.xyz/api.php?use_xbridge3=true&loader_name=forest&need_sec_link=1&sec_link_scene=im",
    qishui: "https://api.vsaa.cn/api/music.qishui.vip",
    changqing: "http://175.27.166.236",
    nianxin: "https://music.nxinxz.com"
};

module.exports = {
    platform: "全豆要聚合",
    version: "5.5.0",
    order: 1,
    // 搜索
    async search(keyword, page, type) {
        if (type !== "music") return null;
        try {
            const res = await axios.get(APIS.qishui, {
                params: { act: "search", keywords: keyword, page: page, pagesize: 20, type: "music" }
            });
            const list = res.data?.data?.lists || [];
            return {
                isEnd: list.length < 20,
                data: list.map((item) => ({
                    id: String(item.id || item.vid),
                    name: String(item.name),
                    artist: String(item.artists),
                    album: String(item.album || ""),
                    img: String(item.cover || item.pic || ""),
                    platform: "netease" 
                }))
            };
        } catch (e) { return null; }
    },
    // 播放
    async getMediaSource(item, quality) {
        const id = item.id;
        const br = { low: "128", standard: "320", high: "320", super: "740" }[quality] || "128";
        const level = quality === "low" ? "standard" : "lossless";

        // 顺序尝试链路
        try {
            const r1 = await axios.get(`${APIS.xinghai}&types=url&source=netease&id=${id}&br=${br}`);
            if (r1.data?.url) return { url: r1.data.url };
        } catch (e) {}

        try {
            const r2 = await axios.get(`${APIS.changqing}/wy/wy.php?type=mp3&id=${id}&level=${level}`);
            if (r2.data?.url) return { url: r2.data.url };
        } catch (e) {}

        return null;
    }
};

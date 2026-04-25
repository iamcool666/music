/*!
 * @name 非常刀
 * @description 接入网易、酷我、JOOX、哔哩哔哩 ，进群链接 https://t.me/gydjlfk
 * @version v2
 * @author 群主要进去
 */

const { EVENT_NAMES, request, on, send } = globalThis.lx

// ========== 全局配置 ==========
const SOLARA_API = 'https://yy.bttts.com/proxy'

// ========== 缓存配置 ==========
const cache = new Map()
const CACHE_TTL = 300000 // 5分钟缓存

// ========== 音质配置 ==========
const DEFAULT_QUALITY_ORDER = ['999', '320', '192', '128']
const QUALITY_MAP = {
    '128k': '128',
    '192k': '192',
    '320k': '320',
    'flac': '999',
    'lossless': '999',
    'hires': '999',
    'flac24bit': '999',
    '24bit': '999',
    'master': '999',
    'atmos': '999',
    'dolby': '999',
    '128': '128',
    '192': '192',
    '320': '320',
    '999': '999'
}

const SOURCE_MAP = {
    wy: 'netease',
    kw: 'kuwo',
    jo: 'joox',
    bl: 'bilibili'
}

// ========== 主事件处理器 ==========
on(EVENT_NAMES.request, async ({ action, source, info }) => {
    try {
        switch (action) {
            case 'musicUrl':
                return await handleMusicUrl(source, info)
            case 'search':
                return await handleSearch(source, info)
            default:
                throw new Error('不支持的操作')
        }
    } catch (error) {
        console.error(`[非常刀] ${source} ${action} 错误:`, error.message)
        throw error
    }
})

// ========== 获取音乐URL ==========
async function handleMusicUrl(source, info) {
    if (!info?.musicInfo) throw new Error('需要歌曲信息')

    const musicInfo = info.musicInfo
    const quality = info.type || '128k'

    switch (source) {
        case 'wy':
            return await getWyMusicUrl(musicInfo, quality)
        case 'kw':
            return await getKwMusicUrl(musicInfo, quality)
        case 'jo':
            return await getJoMusicUrl(musicInfo, quality)
        case 'bl':
            return await getBlMusicUrl(musicInfo, quality)
        default:
            throw new Error('不支持的平台')
    }
}

// ========== 网易云音乐模块 ==========
async function getWyMusicUrl(musicInfo, quality) {
    return await getSourceMusicUrl('wy', musicInfo, quality)
}

// ========== 酷我音乐模块 ==========
async function getKwMusicUrl(musicInfo, quality) {
    return await getSourceMusicUrl('kw', musicInfo, quality)
}

// ========== JOOX音乐模块 ==========
async function getJoMusicUrl(musicInfo, quality) {
    return await getSourceMusicUrl('jo', musicInfo, quality)
}

// ========== 哔哩哔哩模块 ==========
async function getBlMusicUrl(musicInfo, quality) {
    return await getSourceMusicUrl('bl', musicInfo, quality)
}

async function getSourceMusicUrl(source, musicInfo, quality) {
    const apiSource = SOURCE_MAP[source]
    if (!apiSource) throw new Error('不支持的平台')

    const cacheKey = `url_${source}_${musicInfo.id || ''}_${musicInfo.name || ''}_${musicInfo.albumName || musicInfo.album || ''}_${musicInfo.singer || ''}_${quality}`
    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey)
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.url
        }
    }

    const song = await resolveSongForSource(source, musicInfo)
    const urlId = getUrlId(source, song)
    if (!urlId) throw new Error('缺少歌曲ID')

    const qualities = getQualityFallbacks(QUALITY_MAP[quality] || '320')
    for (const br of qualities) {
        try {
            const data = await sendRequest(SOLARA_API, {
                types: 'url',
                id: urlId,
                source: apiSource,
                br: br,
                s: createSignature()
            })

            if (data?.url) {
                cache.set(cacheKey, { url: data.url, timestamp: Date.now() })
                return data.url
            }
        } catch (error) {
            continue
        }
    }

    throw new Error('无法获取音频链接')
}

async function resolveSongForSource(source, musicInfo) {
    const urlId = getUrlId(source, musicInfo)
    if (urlId) return musicInfo

    if (!musicInfo.name) throw new Error('需要歌曲名称')

    const apiSource = SOURCE_MAP[source]
    const searchPriority = getSearchPriority(musicInfo)

    for (const term of searchPriority) {
        try {
            console.log(`[非常刀-${source}] 尝试搜索: ${term.keyword} (严格: ${term.strict})`)
            const list = await searchSource(apiSource, term.keyword, 10, 1)
            const matched = findMatchedSong(source, list, musicInfo, term.strict)
            if (matched) return matched
        } catch (error) {
            console.log(`[非常刀-${source}] 搜索失败: ${term.keyword} - ${error.message}`)
        }
    }

    throw new Error('未找到匹配歌曲')
}

function getUrlId(source, musicInfo) {
    if (!musicInfo) return null

    const sourceMeta = musicInfo.meta?.[source]
    if (sourceMeta?.url_id || sourceMeta?.id) {
        return sourceMeta.url_id || sourceMeta.id
    }

    if (musicInfo.meta?.solara?.url_id && musicInfo.meta?.solara?.source === SOURCE_MAP[source]) {
        return musicInfo.meta.solara.url_id
    }

    if (musicInfo.source === source) {
        return musicInfo.url_id || musicInfo.id || null
    }

    return null
}

// ========== 搜索功能 ==========
async function handleSearch(source, info) {
    if (!info?.keyword) throw new Error('需要搜索关键词')

    const keyword = info.keyword.trim()
    const page = info.page || 1
    const limit = Math.min(info.limit || 20, 30)

    switch (source) {
        case 'wy':
            return await searchWyMusic(keyword, page, limit)
        case 'kw':
            return await searchKwMusic(keyword, page, limit)
        case 'jo':
            return await searchJoMusic(keyword, page, limit)
        case 'bl':
            return await searchBlMusic(keyword, page, limit)
        default:
            throw new Error('该平台不支持搜索')
    }
}

async function searchWyMusic(keyword, page, limit) {
    return await searchAndNormalize('wy', keyword, page, limit)
}

async function searchKwMusic(keyword, page, limit) {
    return await searchAndNormalize('kw', keyword, page, limit)
}

async function searchJoMusic(keyword, page, limit) {
    return await searchAndNormalize('jo', keyword, page, limit)
}

async function searchBlMusic(keyword, page, limit) {
    return await searchAndNormalize('bl', keyword, page, limit)
}

async function searchAndNormalize(source, keyword, page, limit) {
    const apiSource = SOURCE_MAP[source]
    const keywords = getKeywordFallbacks(keyword)

    for (const currentKeyword of keywords) {
        const data = await searchSource(apiSource, currentKeyword, limit, page)
        if (Array.isArray(data) && data.length > 0) {
            return data.slice(0, limit).map(item => normalizeSong(item, source, apiSource))
        }
    }

    throw new Error('未找到相关歌曲')
}

async function searchSource(apiSource, keyword, limit, page) {
    const data = await sendRequest(SOLARA_API, {
        types: 'search',
        source: apiSource,
        name: keyword,
        count: limit,
        pages: page,
        s: createSignature()
    })

    if (Array.isArray(data)) return data
    throw new Error('搜索结果格式错误')
}

function normalizeSong(song, source, apiSource) {
    const singer = Array.isArray(song.artist) ? song.artist.join(' / ') : (song.artist || '')

    return {
        name: song.name || '',
        singer: singer,
        albumName: song.album || '',
        id: song.id,
        source: source,
        interval: formatDuration(song.interval || song.duration || song.time),
        meta: {
            picture: buildPictureUrl(song.pic_id, apiSource),
            [source]: {
                id: song.id,
                url_id: song.url_id || song.id,
                lyric_id: song.lyric_id || song.id,
                pic_id: song.pic_id || ''
            },
            solara: {
                source: apiSource,
                url_id: song.url_id || song.id,
                lyric_id: song.lyric_id || song.id,
                pic_id: song.pic_id || ''
            }
        }
    }
}

function findMatchedSong(source, list, musicInfo, strict) {
    if (!Array.isArray(list) || list.length === 0) return null

    if (!strict) return list[0]

    for (const item of list) {
        if (checkSongMatch(source, item, musicInfo)) {
            return item
        }
    }

    return null
}

function checkSongMatch(source, apiData, musicInfo) {
    const apiTitle = cleanText(apiData.name || '')
    const apiArtist = cleanText(Array.isArray(apiData.artist) ? apiData.artist.join(' / ') : (apiData.artist || ''))
    const apiAlbum = cleanText(apiData.album || '')

    const songName = cleanText(musicInfo.name || '')
    const singer = cleanText(musicInfo.singer || '')
    const album = cleanText((musicInfo.albumName || musicInfo.album) || '')

    if (!apiTitle || !songName) return false

    if (!apiTitle.includes(songName) && !songName.includes(apiTitle)) {
        return false
    }

    if (source === 'bl') {
        if (singer) {
            const titleAndArtist = `${apiTitle}${apiArtist}`
            if (!titleAndArtist.includes(singer)) {
                return false
            }
        }
        return true
    }

    if (album && apiAlbum && !apiAlbum.includes(album) && !album.includes(apiAlbum)) {
        return false
    }

    if (singer && apiArtist && !apiArtist.includes(singer) && !singer.includes(apiArtist)) {
        return false
    }

    return true
}

// ========== 核心工具函数 ==========
function getSearchPriority(musicInfo) {
    const priority = []

    if (musicInfo.albumName || musicInfo.album) {
        const album = musicInfo.albumName || musicInfo.album
        const keyword = cleanText(`${musicInfo.name} ${album}`)
        if (keyword) {
            priority.push({
                keyword: keyword,
                strict: true,
                type: 'name+album'
            })
        }
    }

    if (musicInfo.singer) {
        const keyword = cleanText(`${musicInfo.name} ${musicInfo.singer}`)
        if (keyword) {
            priority.push({
                keyword: keyword,
                strict: true,
                type: 'name+singer'
            })
        }
    }

    const keyword = cleanText(musicInfo.name)
    if (keyword) {
        priority.push({
            keyword: keyword,
            strict: false,
            type: 'name'
        })
    }

    return priority
}

function getKeywordFallbacks(keyword) {
    const list = []
    if (keyword) list.push(keyword.trim())

    const cleaned = cleanText(keyword)
    if (cleaned && !list.includes(cleaned)) {
        list.push(cleaned)
    }

    return list.filter(Boolean)
}

function getQualityFallbacks(quality) {
    if (quality === '999') return ['999', '320', '192', '128']
    if (quality === '320') return ['320', '192', '128', '999']
    if (quality === '192') return ['192', '128', '320', '999']
    if (quality === '128') return ['128', '192', '320', '999']
    return DEFAULT_QUALITY_ORDER
}

function formatDuration(value) {
    if (!value) return '00:00'
    if (typeof value === 'string' && /^\d{2}:\d{2}$/.test(value)) return value

    const seconds = parseInt(value, 10)
    if (!Number.isFinite(seconds) || seconds <= 0) return '00:00'

    const minutes = Math.floor(seconds / 60)
    const remain = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remain.toString().padStart(2, '0')}`
}

function buildPictureUrl(picId, apiSource) {
    if (!picId) return ''

    const params = {
        types: 'pic',
        id: picId,
        source: apiSource,
        size: 300,
        s: createSignature()
    }

    const query = Object.keys(params)
        .map(key => `${key}=${encodeURIComponent(params[key])}`)
        .join('&')

    return `${SOLARA_API}?${query}`
}

function createSignature() {
    return Math.random().toString(36).slice(2, 15) + Math.random().toString(36).slice(2, 15)
}

function getRequestCacheKey(baseUrl, params) {
    const query = Object.keys(params)
        .filter(key => key !== 's')
        .sort()
        .map(key => `${key}=${encodeURIComponent(params[key])}`)
        .join('&')

    return `${baseUrl}?${query}`
}

function sendRequest(baseUrl, params = {}) {
    const cacheKey = getRequestCacheKey(baseUrl, params)
    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey)
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return Promise.resolve(cached.data)
        }
    }

    return new Promise((resolve, reject) => {
        const query = Object.keys(params)
            .map(key => `${key}=${encodeURIComponent(params[key])}`)
            .join('&')
        const url = `${baseUrl}?${query}`

        request(url, {
            method: 'GET',
            timeout: 10000,
            headers: {
                Accept: 'application/json',
                Referer: 'https://yy.bttts.com/'
            }
        }, (err, resp) => {
            if (err) {
                reject(new Error(`请求失败: ${err.message}`))
                return
            }

            try {
                const text = typeof resp.body === 'string' ? resp.body : JSON.stringify(resp.body)
                if (!text) throw new Error('空响应')
                if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                    throw new Error('响应格式错误')
                }

                const data = typeof resp.body === 'string' ? JSON.parse(resp.body) : resp.body
                if (data?.detail) {
                    throw new Error(data.detail)
                }

                cache.set(cacheKey, { data, timestamp: Date.now() })
                resolve(data)
            } catch (error) {
                reject(new Error(error.message || '响应格式错误'))
            }
        })
    })
}

function cleanText(text) {
    if (!text) return ''
    return text
        .replace(/（[^）]*）/g, '')
        .replace(/\([^)]*\)/g, '')
        .replace(/\[[^\]]*\]/g, '')
        .replace(/\s+/g, '')
        .replace(/[【】《》“”"'‘’·,，。!！?？:：;；/\\|\-]/g, '')
        .trim()
        .toLowerCase()
}

// ========== 初始化 ==========
const registeredSources = {
    wy: {
        name: '网易云音乐',
        type: 'music',
        actions: ['musicUrl', 'search'],
        qualitys: ['128k', '192k', '320k', 'flac'],
        supportSearchSuggestions: true,
        defaultQuality: '128k'
    },
    kw: {
        name: '酷我音乐',
        type: 'music',
        actions: ['musicUrl', 'search'],
        qualitys: ['128k', '192k', '320k', 'flac'],
        supportSearchSuggestions: true,
        defaultQuality: '128k'
    },
    jo: {
        name: 'JOOX音乐',
        type: 'music',
        actions: ['musicUrl', 'search'],
        qualitys: ['128k', '192k', '320k', 'flac'],
        supportSearchSuggestions: true,
        defaultQuality: '128k'
    },
    bl: {
        name: '哔哩哔哩',
        type: 'music',
        actions: ['musicUrl', 'search'],
        qualitys: ['128k', '320k'],
        supportSearchSuggestions: false,
        defaultQuality: '128k'
    }
}

send(EVENT_NAMES.inited, {
    openDevTools: false,
    sources: registeredSources
})

console.log('[非常刀] v2 已加载 - 支持网易、酷我、JOOX、哔哩哔哩')

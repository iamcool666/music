/*!
 * @name 独家音源 解密版
 * @description 音源更新，关注微信公众号：洛雪科技
 * @version 4
 * @author 洛雪科技＆玥然OvO
 * @repository https://github.com/lxmusics/lx-music-api-server
 */

// 是否开启开发模式
const DEV_ENABLE = false
// 是否开启更新提醒
const UPDATE_ENABLE = false
// 服务端地址
const API_URL = "https://88.lxmusic.xn--fiqs8s"
// 服务端配置的请求key
const API_KEY = `lxmusic`
// 从签名版本提取的关键信息
const SECRET_KEY = 'JaJ?a7Nwk_Fgj?2o:znAkst'
const SCRIPT_MD5 = '1888f9865338afe6d5534b35171c61a4'

// 音质配置(key为音源名称,不要乱填.如果你账号为VIP可以填写到hires)
const MUSIC_QUALITY = {
  kw: ['128k', '320k', 'flac', 'flac24bit'],
  kg: ['128k', '320k', 'flac', 'flac24bit'],
  tx: ['128k', '320k', 'flac', 'flac24bit'],
  wy: ['128k', '320k', 'flac', 'flac24bit'],
  mg: ['128k', '320k', 'flac', 'flac24bit']
}

// 音源配置
const MUSIC_SOURCE = Object.keys(MUSIC_QUALITY)

/**
 * 下面的东西就不要修改了
 */
const { EVENT_NAMES, request, on, send, env, version } = globalThis.lx

// 简化的SHA256实现
const sha256 = (function() {
  "use strict";
  var HEX_CHARS = '0123456789abcdef'.split('');
  
  function Sha256() {
    this.blocks = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    this.h0 = 0x6a09e667;
    this.h1 = 0xbb67ae85;
    this.h2 = 0x3c6ef372;
    this.h3 = 0xa54ff53a;
    this.h4 = 0x510e527f;
    this.h5 = 0x9b05688c;
    this.h6 = 0x1f83d9ab;
    this.h7 = 0x5be0cd19;
    this.block = this.start = this.bytes = this.hBytes = 0;
    this.finalized = this.hashed = false;
    this.first = true;
  }

  Sha256.prototype.update = function(message) {
    if (this.finalized) return;
    
    var notString = typeof message !== 'string';
    var blocks = this.blocks;
    
    for (var i = 0; i < message.length; i++) {
      if (this.hashed) {
        this.hashed = false;
        blocks[0] = this.block;
        blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = 
        blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = 
        blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
      }
      
      var code = notString ? message[i] : message.charCodeAt(i);
      blocks[this.start >> 2] |= code << (24 - (this.start % 4) * 8);
      this.start++;
      
      if (this.start === 64) {
        this.block = blocks[16];
        this.start = 0;
        this.hash();
        this.hashed = true;
      }
    }
    
    this.bytes += message.length;
    if (this.bytes > 4294967295) {
      this.hBytes += this.bytes / 4294967296 << 0;
      this.bytes = this.bytes % 4294967296;
    }
    return this;
  };

  Sha256.prototype.finalize = function() {
    if (this.finalized) return;
    this.finalized = true;
    
    var blocks = this.blocks;
    var i = this.start;
    blocks[16] = this.block;
    blocks[i >> 2] |= 0x80 << (24 - (i % 4) * 8);
    this.block = blocks[16];
    
    if (i >= 56) {
      if (!this.hashed) this.hash();
      blocks[0] = this.block;
      blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = 
      blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = 
      blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
    }
    
    blocks[14] = this.hBytes << 3 | this.bytes >>> 29;
    blocks[15] = this.bytes << 3;
    this.hash();
  };

  Sha256.prototype.hash = function() {
    var K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
      0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
      0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
      0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
      0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
      0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
      0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
      0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
      0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    
    var a = this.h0, b = this.h1, c = this.h2, d = this.h3,
        e = this.h4, f = this.h5, g = this.h6, h = this.h7,
        blocks = this.blocks;
    
    for (var j = 0; j < 64; j++) {
      if (j >= 16) {
        var w0 = blocks[j - 15];
        var w1 = blocks[j - 2];
        var s0 = ((w0 >>> 7) | (w0 << 25)) ^ ((w0 >>> 18) | (w0 << 14)) ^ (w0 >>> 3);
        var s1 = ((w1 >>> 17) | (w1 << 15)) ^ ((w1 >>> 19) | (w1 << 13)) ^ (w1 >>> 10);
        blocks[j] = blocks[j - 16] + s0 + blocks[j - 7] + s1;
      }
      
      var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      var ch = (e & f) ^ ((~e) & g);
      var temp1 = h + S1 + ch + K[j] + (blocks[j] >>> 0);
      var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      var maj = (a & b) ^ (a & c) ^ (b & c);
      var temp2 = S0 + maj;
      
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }
    
    this.h0 = (this.h0 + a) >>> 0;
    this.h1 = (this.h1 + b) >>> 0;
    this.h2 = (this.h2 + c) >>> 0;
    this.h3 = (this.h3 + d) >>> 0;
    this.h4 = (this.h4 + e) >>> 0;
    this.h5 = (this.h5 + f) >>> 0;
    this.h6 = (this.h6 + g) >>> 0;
    this.h7 = (this.h7 + h) >>> 0;
  };

  Sha256.prototype.hex = function() {
    this.finalize();
    var h0 = this.h0, h1 = this.h1, h2 = this.h2, h3 = this.h3,
        h4 = this.h4, h5 = this.h5, h6 = this.h6, h7 = this.h7;
    
    return HEX_CHARS[(h0 >> 28) & 0x0F] + HEX_CHARS[(h0 >> 24) & 0x0F] +
           HEX_CHARS[(h0 >> 20) & 0x0F] + HEX_CHARS[(h0 >> 16) & 0x0F] +
           HEX_CHARS[(h0 >> 12) & 0x0F] + HEX_CHARS[(h0 >> 8) & 0x0F] +
           HEX_CHARS[(h0 >> 4) & 0x0F] + HEX_CHARS[h0 & 0x0F] +
           HEX_CHARS[(h1 >> 28) & 0x0F] + HEX_CHARS[(h1 >> 24) & 0x0F] +
           HEX_CHARS[(h1 >> 20) & 0x0F] + HEX_CHARS[(h1 >> 16) & 0x0F] +
           HEX_CHARS[(h1 >> 12) & 0x0F] + HEX_CHARS[(h1 >> 8) & 0x0F] +
           HEX_CHARS[(h1 >> 4) & 0x0F] + HEX_CHARS[h1 & 0x0F] +
           HEX_CHARS[(h2 >> 28) & 0x0F] + HEX_CHARS[(h2 >> 24) & 0x0F] +
           HEX_CHARS[(h2 >> 20) & 0x0F] + HEX_CHARS[(h2 >> 16) & 0x0F] +
           HEX_CHARS[(h2 >> 12) & 0x0F] + HEX_CHARS[(h2 >> 8) & 0x0F] +
           HEX_CHARS[(h2 >> 4) & 0x0F] + HEX_CHARS[h2 & 0x0F] +
           HEX_CHARS[(h3 >> 28) & 0x0F] + HEX_CHARS[(h3 >> 24) & 0x0F] +
           HEX_CHARS[(h3 >> 20) & 0x0F] + HEX_CHARS[(h3 >> 16) & 0x0F] +
           HEX_CHARS[(h3 >> 12) & 0x0F] + HEX_CHARS[(h3 >> 8) & 0x0F] +
           HEX_CHARS[(h3 >> 4) & 0x0F] + HEX_CHARS[h3 & 0x0F] +
           HEX_CHARS[(h4 >> 28) & 0x0F] + HEX_CHARS[(h4 >> 24) & 0x0F] +
           HEX_CHARS[(h4 >> 20) & 0x0F] + HEX_CHARS[(h4 >> 16) & 0x0F] +
           HEX_CHARS[(h4 >> 12) & 0x0F] + HEX_CHARS[(h4 >> 8) & 0x0F] +
           HEX_CHARS[(h4 >> 4) & 0x0F] + HEX_CHARS[h4 & 0x0F] +
           HEX_CHARS[(h5 >> 28) & 0x0F] + HEX_CHARS[(h5 >> 24) & 0x0F] +
           HEX_CHARS[(h5 >> 20) & 0x0F] + HEX_CHARS[(h5 >> 16) & 0x0F] +
           HEX_CHARS[(h5 >> 12) & 0x0F] + HEX_CHARS[(h5 >> 8) & 0x0F] +
           HEX_CHARS[(h5 >> 4) & 0x0F] + HEX_CHARS[h5 & 0x0F] +
           HEX_CHARS[(h6 >> 28) & 0x0F] + HEX_CHARS[(h6 >> 24) & 0x0F] +
           HEX_CHARS[(h6 >> 20) & 0x0F] + HEX_CHARS[(h6 >> 16) & 0x0F] +
           HEX_CHARS[(h6 >> 12) & 0x0F] + HEX_CHARS[(h6 >> 8) & 0x0F] +
           HEX_CHARS[(h6 >> 4) & 0x0F] + HEX_CHARS[h6 & 0x0F] +
           HEX_CHARS[(h7 >> 28) & 0x0F] + HEX_CHARS[(h7 >> 24) & 0x0F] +
           HEX_CHARS[(h7 >> 20) & 0x0F] + HEX_CHARS[(h7 >> 16) & 0x0F] +
           HEX_CHARS[(h7 >> 12) & 0x0F] + HEX_CHARS[(h7 >> 8) & 0x0F] +
           HEX_CHARS[(h7 >> 4) & 0x0F] + HEX_CHARS[h7 & 0x0F];
  };

  return function(message) {
    return new Sha256().update(message).hex();
  };
})();

/**
 * 生成签名
 */
const generateSign = (requestPath) => {
  return sha256(requestPath + SCRIPT_MD5 + SECRET_KEY)
}

/**
 * 根据音源获取歌曲ID - 使用V1版本的逻辑
 */
const getSongIdForSource = (source, musicInfo) => {
  return musicInfo.hash ?? musicInfo.songmid;
}

/**
 * URL请求
 */
const httpFetch = (url, options = { method: 'GET' }) => {
  const isFullUrl = url.startsWith('http')
  
  if (!isFullUrl) {
    const requestPath = url
    const sign = generateSign(requestPath)
    url = `${API_URL}${requestPath}?sign=${sign}`
  }
  
  return new Promise((resolve, reject) => {
    request(url, {
      method: options.method || 'GET',
      headers: {
        'accept': 'application/json',
        'x-request-key': API_KEY,
        'user-agent': `${env ? `lx-music-${env}/${version}` : 'lx-music-request/2.0.0'}`,
        ...options.headers
      },
      ...options
    }, (err, resp, body) => {
      if (err) return reject(err)
      
      const statusCode = resp ? (resp.statusCode || resp.status || 200) : 200
      const responseBody = body || (resp ? resp.body : null)
      
      resolve({
        statusCode,
        body: responseBody,
        headers: resp ? resp.headers : {}
      })
    })
  })
}

/**
 * 获取音乐播放链接
 */
const handleGetMusicUrl = async (source, musicInfo, quality) => {
  const songId = getSongIdForSource(source, musicInfo)
  const requestPath = `/lxmusicv4/url/${source}/${songId}/${quality}`
  
  const response = await httpFetch(requestPath)
  const { body, statusCode } = response

  if (statusCode === 404) {
    throw new Error('API端点不存在')
  }
  
  if (statusCode >= 500) {
    throw new Error(`服务器错误 (${statusCode})`)
  }
  
  if (!body) {
    throw new Error('服务器返回空响应')
  }

  const data = typeof body === 'string' ? JSON.parse(body) : body
  
  if (!data || isNaN(Number(data.code))) {
    throw new Error('无效的响应数据')
  }

  switch (data.code) {
    case 0:
    case 200:
      const musicUrl = data.data || data.url
      if (musicUrl) {
        return musicUrl
      } else {
        throw new Error('响应中未找到有效的URL')
      }
    case 1:
      throw new Error('block ip')
    case 2:
      throw new Error(data.msg || 'get music url failed')
    case 4:
      throw new Error('internal server error')
    case 5:
      throw new Error('too many requests')
    case 6:
      throw new Error('param error')
    default:
      throw new Error(data.msg ?? `Unknown error (code: ${data.code})`)
  }
}

/**
 * 检查更新
 */
const checkUpdate = async () => {
  try {
    const request = await httpFetch(`/script?key=${API_KEY}&checkUpdate=`, {
      method: 'GET',
    })
    const { body } = request

    if (body && body.code === 0 && body.data != null) {
      globalThis.lx.send(lx.EVENT_NAMES.updateAlert, { 
        log: body.data.updateMsg, 
        updateUrl: body.data.updateUrl 
      })
    }
  } catch (e) {
    // 更新检查失败不影响主功能
  }
}

// 生成歌曲信息配置
const musicSources = {}
MUSIC_SOURCE.forEach(item => {
  musicSources[item] = {
    name: item,
    type: 'music',
    actions: ['musicUrl'],
    qualitys: MUSIC_QUALITY[item],
  }
})

// 监听 LX Music 请求事件
on(EVENT_NAMES.request, ({ action, source, info }) => {
  switch (action) {
    case 'musicUrl':
      return handleGetMusicUrl(source, info.musicInfo, info.type)
        .then(data => Promise.resolve(data))
        .catch(err => Promise.reject(err))
    case 'pic':
    case 'lyric':
      return Promise.reject(`action(${action}) not support for source(${source})`)
    default:
      return Promise.reject('action not support')
  }
})

// 检查更新
if (UPDATE_ENABLE) checkUpdate()

// 向 LX Music 发送初始化成功事件
send(EVENT_NAMES.inited, { 
  status: true, 
  openDevTools: DEV_ENABLE, 
  sources: musicSources 
})
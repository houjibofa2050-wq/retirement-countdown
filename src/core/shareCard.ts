// 分享卡：用离屏 canvas 绘制一张可下载分享的 PNG。数据只读，不依赖 DOM 上文字度量失败之类的 HMR 细节。
// 只在浏览器端调用；保持纯函数便于依赖注入测试（本 MVP 不注入）。

export interface SharePayload {
  name: string // 届别/昵称，如 "2036 届"
  workdays: number
  natural: number
  goalISO: string
  genderShort: string
}

const W = 1000
const H = 1000
const pad = 64

function roundedPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

async function whenFontsReady(): Promise<void> {
  try {
    await document.fonts.ready
  } catch {
    /* noop */
  }
}

/** 绘制并返回 PNG dataURL。 */
export async function buildSharePNG(p: SharePayload): Promise<string> {
  await whenFontsReady()
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const ctx = cv.getContext('2d')!
  // 背景
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#ff9a4d')
  bg.addColorStop(1, '#ffc371')
  ctx.fillStyle = bg
  roundedPath(ctx, 0, 0, W, H, 0)
  ctx.fill()

  const ink = '#2b2118'
  const faint = '#ffffff'
  const sub = 'rgba(43,33,24,.72)'
  ctx.fillStyle = faint

  // 品牌行
  ctx.font = '700 44px system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('⏳ 退休倒计时 · 倒数自由', pad, pad + 44)

  // 界别 pill 描边
  const pillTxt = `${p.name}`
  ctx.font = '600 40px system-ui, sans-serif'
  ctx.fillStyle = ink
  ctx.fillText(pillTxt, pad, pad + 170)

  // 中央标题
  ctx.fillStyle = ink
  ctx.font = '600 52px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('距离自由，还剩', W / 2, 380)

  // 大数字
  const numFmt = p.workdays.toLocaleString('zh-CN')
  ctx.font = '800 250px system-ui, sans-serif'
  ctx.fillStyle = '#fff'
  ctx.fillText(numFmt, W / 2, 600)
  ctx.font = '600 60px system-ui, sans-serif'
  ctx.fillStyle = ink
  ctx.fillText('个工作日', W / 2, 690)

  // 换算 & 目标
  ctx.font = '500 46px system-ui, sans-serif'
  ctx.fillStyle = sub
  ctx.fillText(
    `约 ${p.natural.toLocaleString('zh-CN')} 个自然日  ·  ${p.goalISO}`,
    W / 2,
    790,
  )

  // 底部
  ctx.font = '400 36px system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,.9)'
  ctx.fillText(`本轮按国家现行延迟退休口径估算 · ${p.genderShort}`, W / 2, H - pad * 0.5)
  return cv.toDataURL('image/png')
}

/** 生成并直接触发下载。 */
export async function downloadShareCard(p: SharePayload): Promise<void> {
  const url = await buildSharePNG(p)
  const a = document.createElement('a')
  a.href = url
  a.download = `${p.name || '退休倒计时'}-剩余${p.workdays}个工作日.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

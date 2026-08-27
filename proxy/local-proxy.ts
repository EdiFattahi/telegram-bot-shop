import { SocksProxyAgent } from 'socks-proxy-agent'

// استفاده از پروکسی تلگرام
export function getTelegramProxy() {
  // تلگرام دسکتاپ معمولاً SOCKS5 روی این پورت داره
  return new SocksProxyAgent('socks5://127.0.0.1:10808')
}
const apiProxyTarget =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_PROXY_TARGET ||
  "http://localhost:8080";

module.exports = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/:path*`,
      },
    ];
  },
};

import mkcert from "vite-plugin-mkcert";
export default {
    plugins: [
        mkcert({
            source: "coding",
            hosts: ["localhost", "127.0.0.1"],
        }),
    ],
    server: {
        https: true,
    },
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Nagyon fontos: a pdfkit maradjon "külső" csomag, hogy a saját AFM fájljai elérhetők legyenek
    serverComponentsExternalPackages: ["pdfkit"]
  }
};

module.exports = nextConfig;

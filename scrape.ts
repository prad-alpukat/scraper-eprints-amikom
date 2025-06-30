import { JSDOM } from "jsdom"; // Mengimpor JSDOM
import * as xpath from "xpath"; // Mengimpor xpath

// === KONFIGURASI SCRAPING ===
const CONFIG = {
  // ============================================
  // PENGATURAN JUMLAH ARTIKEL YANG DI-SCRAPE
  // ============================================
  // null = Scrape SEMUA artikel (379 artikel) - memakan waktu ~16 jam
  // 10 = Hanya scrape 10 artikel pertama (untuk testing) - memakan waktu ~1 menit
  // 50 = Scrape 50 artikel pertama - memakan waktu ~5 menit
  // 100 = Scrape 100 artikel pertama - memakan waktu ~10 menit
  MAX_ARTICLES_TO_SCRAPE: null as number | null, // Ubah ke null untuk scrape SEMUA artikel

  // ============================================
  // PENGATURAN DELAY DAN BACKUP
  // ============================================
  // Delay antar request (dalam milidetik) - jangan terlalu kecil agar tidak di-block
  DELAY_BETWEEN_REQUESTS: 2000, // 2 detik (rekomendasi: 2000-5000)

  // Interval untuk backup progress (setiap berapa artikel)
  BACKUP_INTERVAL: 50, // Backup setiap 50 artikel

  // URL base
  BASE_URL: "https://eprints.amikom.ac.id/view/divisions/tk",
};

async function scrapeWebsite(url: string, xpathExpression: string) {
  try {
    // Menggunakan Fetch API bawaan Bun untuk mengambil halaman web
    const response = await fetch(url);

    // Memastikan permintaan sukses
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text(); // Mendapatkan konten HTML sebagai string

    // Memuat HTML ke JSDOM untuk mendukung XPath
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Menggunakan XPath untuk mencari elemen dalam li di class ep_view_menu
    const nodes = xpath.select(xpathExpression, document) as Node[];

    if (nodes.length > 0) {
      const targetElement = nodes[0] as Element;

      // Periksa apakah elemen berada dalam ep_view_menu dan li
      const isInMenu = targetElement.closest(".ep_view_menu") !== null;
      const isInLi = targetElement.closest("li") !== null;
      console.log(`Elemen ditemukan dalam ep_view_menu: ${isInMenu}`);
      console.log(`Elemen ditemukan dalam li: ${isInLi}`);

      // Mengambil teks dan atribut href
      const text = targetElement.textContent?.trim() || "";
      const link = targetElement.getAttribute("href") || "";

      return { text, link, isInMenu, isInLi };
    } else {
      console.warn(`Elemen tidak ditemukan dengan XPath: ${xpathExpression}`);
      return null;
    }
  } catch (error: any) {
    console.error(`Terjadi kesalahan saat scraping: ${error.message}`);
    return null;
  }
}

// Fungsi debug untuk melihat struktur HTML dan mencoba beberapa XPath
async function debugScrapeWebsite(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    console.log("\n--- DEBUG INFO ---");
    console.log("Title:", document.title);

    // Coba beberapa XPath alternatif
    const alternativeXPaths = [
      "//a[1]", // Link pertama di halaman
      "//ul/li[1]/a", // Link pertama dalam list
      "//div//ul//li//a", // Semua link dalam div->ul->li
      "//*[@id]//a[1]", // Link pertama dalam elemen dengan ID
    ];

    console.log("\n--- Mencoba XPath Alternatif ---");
    for (const altXPath of alternativeXPaths) {
      const nodes = xpath.select(altXPath, document) as Node[];
      console.log(`${altXPath}: ${nodes.length} elemen ditemukan`);

      if (nodes.length > 0) {
        const element = nodes[0] as Element;
        const text = element.textContent?.trim().substring(0, 50) || "";
        const href = element.getAttribute("href") || "";
        console.log(`  -> Teks: "${text}..." | Href: "${href}"`);
      }
    }

    return true;
  } catch (error: any) {
    console.error(`Debug error: ${error.message}`);
    return false;
  }
}

// Fungsi untuk melihat struktur DOM yang sebenarnya
async function examinePageStructure(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    console.log("\n--- STRUKTUR HALAMAN ---");
    console.log("Title:", document.title);

    // Periksa apakah ada elemen body
    const body = document.body;
    if (body) {
      console.log("Body ditemukan");

      // Periksa div pertama dalam body
      const firstDiv = body.querySelector("div");
      if (firstDiv) {
        console.log("Div pertama ditemukan");
        console.log(
          "Div pertama innerHTML preview:",
          firstDiv.innerHTML.substring(0, 200) + "..."
        );
      }

      // Cari semua link dalam halaman
      const allLinks = document.querySelectorAll("a");
      console.log(`Total link ditemukan: ${allLinks.length}`);

      // Tampilkan 5 link pertama
      console.log("\n--- 5 LINK PERTAMA ---");
      Array.from(allLinks)
        .slice(0, 5)
        .forEach((link, index) => {
          const text = link.textContent?.trim().substring(0, 50) || "";
          const href = link.getAttribute("href") || "";
          console.log(`${index + 1}. "${text}..." -> "${href}"`);
        });

      // Cari semua ul/li
      const allLists = document.querySelectorAll("ul");
      console.log(`\nTotal <ul> ditemukan: ${allLists.length}`);

      if (allLists.length > 0) {
        console.log("\n--- UL PERTAMA ---");
        const firstUl = allLists[0];
        if (firstUl) {
          const listItems = firstUl.querySelectorAll("li");
          console.log(`Li dalam UL pertama: ${listItems.length}`);

          Array.from(listItems)
            .slice(0, 3)
            .forEach((li, index) => {
              const text = li.textContent?.trim().substring(0, 50) || "";
              console.log(`  Li ${index + 1}: "${text}..."`);

              const linkInLi = li.querySelector("a");
              if (linkInLi) {
                console.log(`    -> Link: "${linkInLi.getAttribute("href")}"`);
              }
            });
        }
      }
    }

    return true;
  } catch (error: any) {
    console.error(`Structure examination error: ${error.message}`);
    return false;
  }
}

// Fungsi untuk mencoba berbagai strategi XPath berdasarkan analisis struktur
async function smartScrapeWebsite(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    console.log("\n=== SMART SCRAPE ===");

    // Strategi yang difokuskan pada class ep_view_menu, elemen li, dan link .html
    const strategies = [
      {
        name: "Link .html dalam li di dalam class ep_view_menu",
        xpath: "//*[@class='ep_view_menu']//li//a[contains(@href, '.html')]",
      },
      {
        name: "Link pertama .html dalam li di ep_view_menu",
        xpath: "//*[@class='ep_view_menu']//li//a[contains(@href, '.html')][1]",
      },
      {
        name: "Link .html dengan tahun dalam li ep_view_menu",
        xpath:
          "//*[@class='ep_view_menu']//li//a[contains(@href, '.html') and (contains(@href, '202') or contains(@href, '201'))]",
      },
      {
        name: "Semua link .html dalam ep_view_menu",
        xpath: "//*[@class='ep_view_menu']//a[contains(@href, '.html')]",
      },
      {
        name: "Link dalam li di dalam class ep_view_menu (semua)",
        xpath: "//*[@class='ep_view_menu']//li//a",
      },
    ];

    for (const strategy of strategies) {
      console.log(`\nMencoba: ${strategy.name}`);
      const nodes = xpath.select(strategy.xpath, document) as Node[];
      console.log(`Ditemukan: ${nodes.length} elemen`);

      if (nodes.length > 0) {
        for (let i = 0; i < Math.min(3, nodes.length); i++) {
          const element = nodes[i] as Element;
          const text = element.textContent?.trim() || "";
          const href = element.getAttribute("href") || "";
          console.log(`  ${i + 1}. Teks: "${text}" | Href: "${href}"`);
        }
      }
    }

    return true;
  } catch (error: any) {
    console.error(`Smart scrape error: ${error.message}`);
    return false;
  }
}

// Fungsi scraping menggunakan DOM methods langsung (lebih reliable)
async function scrapeWithDOMethods(url: string, targetHref?: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    console.log("\n=== SCRAPING DENGAN DOM METHODS ===");

    // Ambil link hanya dari dalam class ep_view_menu dan di dalam elemen li
    const menuContainer = document.querySelector(".ep_view_menu");
    if (!menuContainer) {
      console.log("Elemen dengan class 'ep_view_menu' tidak ditemukan");
      return null;
    }

    // Cari semua elemen li dalam ep_view_menu
    const listItems = menuContainer.querySelectorAll("li");
    console.log(
      `Total <li> ditemukan dalam .ep_view_menu: ${listItems.length}`
    );

    if (listItems.length === 0) {
      console.log("Tidak ada elemen <li> dalam .ep_view_menu");
      return null;
    }

    // Ambil link dari dalam elemen li yang berakhiran .html
    const allLinks = menuContainer.querySelectorAll("li a");
    console.log(
      `Total link ditemukan dalam .ep_view_menu li: ${allLinks.length}`
    );

    // Filter hanya link yang berakhiran .html
    const htmlLinks = Array.from(allLinks).filter((link) => {
      const href = link.getAttribute("href") || "";
      return href.endsWith(".html");
    });

    console.log(`Link dengan ekstensi .html: ${htmlLinks.length}`);

    const results = [];

    for (let i = 0; i < htmlLinks.length; i++) {
      const link = htmlLinks[i];
      if (link) {
        const text = link.textContent?.trim() || "";
        const href = link.getAttribute("href") || "";

        if (href && href.endsWith(".html")) {
          // Hanya ambil yang berakhiran .html
          results.push({
            index: i + 1,
            text: text,
            href: href,
            fullText: text.length > 50 ? text.substring(0, 50) + "..." : text,
          });
        }
      }
    }

    console.log(
      "\n--- SEMUA LINK .html YANG DITEMUKAN DALAM .ep_view_menu li ---"
    );
    results.forEach((result) => {
      console.log(`${result.index}. "${result.fullText}" -> "${result.href}"`);
    });

    // Jika ada target href tertentu, cari yang cocok
    if (targetHref) {
      const matchingLinks = results.filter(
        (result) =>
          result.href.includes(targetHref) ||
          result.text.toLowerCase().includes(targetHref.toLowerCase())
      );

      if (matchingLinks.length > 0) {
        console.log(`\n--- LINK .html YANG COCOK DENGAN "${targetHref}" ---`);
        matchingLinks.forEach((match) => {
          console.log(`${match.index}. "${match.fullText}" -> "${match.href}"`);
        });
        return matchingLinks[0]; // Return yang pertama
      }
    }

    // Return link .html pertama yang memiliki teks dan href
    const firstValidLink = results.find(
      (result) => result.text.length > 0 && result.href.length > 0
    );
    if (firstValidLink) {
      console.log(`\n--- MENGGUNAKAN LINK .html PERTAMA YANG VALID ---`);
      console.log(`"${firstValidLink.fullText}" -> "${firstValidLink.href}"`);
      return firstValidLink;
    }

    return results.length > 0 ? results[0] : null;
  } catch (error: any) {
    console.error(`DOM scraping error: ${error.message}`);
    return null;
  }
}

// Fungsi untuk memeriksa dan menganalisis class ep_view_menu
async function examineEpViewMenu(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    console.log("\n=== ANALISIS CLASS ep_view_menu ===");

    // Cari elemen dengan class ep_view_menu
    const menuElements = document.querySelectorAll(".ep_view_menu");
    console.log(
      `Elemen dengan class 'ep_view_menu' ditemukan: ${menuElements.length}`
    );

    if (menuElements.length === 0) {
      console.log(
        "Class 'ep_view_menu' tidak ditemukan. Mencari class serupa..."
      );

      // Cari class yang mengandung 'menu' atau 'view'
      const allElements = document.querySelectorAll(
        "[class*='menu'], [class*='view']"
      );
      console.log(
        `Elemen dengan class mengandung 'menu' atau 'view': ${allElements.length}`
      );

      Array.from(allElements)
        .slice(0, 10)
        .forEach((el, index) => {
          const className = el.getAttribute("class") || "";
          console.log(`${index + 1}. Class: "${className}"`);
        });

      return false;
    }

    // Analisis setiap elemen ep_view_menu
    menuElements.forEach((menu, index) => {
      console.log(`\n--- ep_view_menu ${index + 1} ---`);
      console.log("HTML preview:", menu.innerHTML.substring(0, 200) + "...");

      // Periksa elemen li dalam menu
      const listItems = menu.querySelectorAll("li");
      console.log(`Elemen <li> dalam menu ini: ${listItems.length}`);

      if (listItems.length > 0) {
        console.log("\n--- ANALISIS ELEMEN LI ---");
        Array.from(listItems)
          .slice(0, 5)
          .forEach((li, liIndex) => {
            const liText = li.textContent?.trim().substring(0, 30) || "";
            console.log(`  Li ${liIndex + 1}: "${liText}..."`);

            const linksInLi = li.querySelectorAll("a");
            console.log(`    Link dalam li ini: ${linksInLi.length}`);

            Array.from(linksInLi).forEach((link, linkIndex) => {
              const text = link.textContent?.trim() || "";
              const href = link.getAttribute("href") || "";
              console.log(`      ${linkIndex + 1}. "${text}" -> "${href}"`);
            });
          });
      }

      // Juga tampilkan semua link (termasuk yang tidak dalam li)
      const allLinks = menu.querySelectorAll("a");
      console.log(`\n--- SEMUA LINK DALAM MENU ---`);
      console.log(`Total link: ${allLinks.length}`);

      Array.from(allLinks)
        .slice(0, 5)
        .forEach((link, linkIndex) => {
          const text = link.textContent?.trim() || "";
          const href = link.getAttribute("href") || "";
          const isInLi = link.closest("li") !== null;
          console.log(
            `  ${linkIndex + 1}. "${text}" -> "${href}" ${
              isInLi ? "[dalam li]" : "[tidak dalam li]"
            }`
          );
        });
    });

    return true;
  } catch (error: any) {
    console.error(`Ep_view_menu examination error: ${error.message}`);
    return false;
  }
}

// Fungsi untuk scraping link dalam halaman yang sudah diakses
async function scrapeInnerPage(url: string) {
  try {
    console.log(`\n=== MENGAKSES HALAMAN INNER: ${url} ===`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    console.log("Title halaman inner:", document.title);

    // Cari elemen dengan class ep_view_page ep_view_page_view_divisions
    const pageContainer = document.querySelector(
      ".ep_view_page.ep_view_page_view_divisions"
    );
    if (!pageContainer) {
      console.log(
        "Elemen dengan class 'ep_view_page ep_view_page_view_divisions' tidak ditemukan"
      );

      // Coba cari class serupa
      const similarElements = document.querySelectorAll(
        "[class*='ep_view_page']"
      );
      console.log(
        `Elemen dengan class mengandung 'ep_view_page': ${similarElements.length}`
      );

      Array.from(similarElements)
        .slice(0, 5)
        .forEach((el, index) => {
          const className = el.getAttribute("class") || "";
          console.log(`  ${index + 1}. Class: "${className}"`);
        });

      return null;
    }

    console.log("Class 'ep_view_page ep_view_page_view_divisions' ditemukan!");

    // Cari elemen p dalam container
    const paragraphs = pageContainer.querySelectorAll("p");
    console.log(`Total elemen <p> ditemukan: ${paragraphs.length}`);

    if (paragraphs.length === 0) {
      console.log("Tidak ada elemen <p> dalam container");
      return null;
    }

    // Ambil semua link dari dalam elemen p
    const linksInParagraphs = pageContainer.querySelectorAll("p a");
    console.log(`Total link dalam <p>: ${linksInParagraphs.length}`);

    const results = [];

    for (let i = 0; i < linksInParagraphs.length; i++) {
      const link = linksInParagraphs[i];
      if (link) {
        const text = link.textContent?.trim() || "";
        const href = link.getAttribute("href") || "";

        if (href) {
          results.push({
            index: i + 1,
            text: text,
            href: href,
            fullText: text.length > 50 ? text.substring(0, 50) + "..." : text,
          });
        }
      }
    }

    console.log("\n--- LINK DALAM <p> DI ep_view_page_view_divisions ---");
    results.forEach((result) => {
      console.log(`${result.index}. "${result.fullText}" -> "${result.href}"`);
    });

    // Analisis struktur paragraf
    console.log("\n--- ANALISIS PARAGRAF ---");
    Array.from(paragraphs)
      .slice(0, 3)
      .forEach((p, index) => {
        const pText = p.textContent?.trim().substring(0, 60) || "";
        const linksInP = p.querySelectorAll("a");
        console.log(`P ${index + 1}: "${pText}..."`);
        console.log(`  Link dalam p ini: ${linksInP.length}`);

        Array.from(linksInP).forEach((link, linkIndex) => {
          const text = link.textContent?.trim() || "";
          const href = link.getAttribute("href") || "";
          console.log(`    ${linkIndex + 1}. "${text}" -> "${href}"`);
        });
      });

    return results.length > 0 ? results : null;
  } catch (error: any) {
    console.error(`Inner page scraping error: ${error.message}`);
    return null;
  }
}

// Fungsi untuk menganalisis struktur halaman inner secara detail
async function analyzeInnerPageStructure(url: string) {
  try {
    console.log(`\n=== ANALISIS STRUKTUR HALAMAN INNER ===`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Cari semua elemen dengan class mengandung 'ep_view'
    const epViewElements = document.querySelectorAll("[class*='ep_view']");
    console.log(
      `Elemen dengan class mengandung 'ep_view': ${epViewElements.length}`
    );

    Array.from(epViewElements)
      .slice(0, 5)
      .forEach((el, index) => {
        const className = el.getAttribute("class") || "";
        const tagName = el.tagName.toLowerCase();
        console.log(`  ${index + 1}. <${tagName}> class="${className}"`);
      });

    // Cari semua elemen dengan class mengandung 'divisions'
    const divisionsElements = document.querySelectorAll("[class*='divisions']");
    console.log(
      `\nElemen dengan class mengandung 'divisions': ${divisionsElements.length}`
    );

    Array.from(divisionsElements)
      .slice(0, 5)
      .forEach((el, index) => {
        const className = el.getAttribute("class") || "";
        const tagName = el.tagName.toLowerCase();
        console.log(`  ${index + 1}. <${tagName}> class="${className}"`);
      });

    // Cari semua elemen p dan analisis isinya
    const allParagraphs = document.querySelectorAll("p");
    console.log(`\nTotal elemen <p> dalam halaman: ${allParagraphs.length}`);

    console.log("\n--- ANALISIS 5 PARAGRAF PERTAMA ---");
    Array.from(allParagraphs)
      .slice(0, 5)
      .forEach((p, index) => {
        const text = p.textContent?.trim().substring(0, 80) || "";
        const links = p.querySelectorAll("a");
        const parentClass =
          p.parentElement?.getAttribute("class") || "no-class";

        console.log(`P ${index + 1}: "${text}..."`);
        console.log(`  Parent class: ${parentClass}`);
        console.log(`  Link dalam p: ${links.length}`);

        Array.from(links).forEach((link, linkIndex) => {
          const linkText = link.textContent?.trim() || "";
          const href = link.getAttribute("href") || "";
          console.log(`    ${linkIndex + 1}. "${linkText}" -> "${href}"`);
        });
      });

    return true;
  } catch (error: any) {
    console.error(`Inner page analysis error: ${error.message}`);
    return false;
  }
}

// Fungsi untuk menulis data ke file CSV
async function writeToCSV(data: any[], filename: string) {
  try {
    // Header CSV
    const headers = ["Index", "Judul", "URL", "Tahun", "Kategori"];

    // Buat baris CSV
    const csvRows = [
      headers.join(","), // Header row
      ...data.map((item, index) => {
        // Escape koma, tanda kutip, dan newline dalam data
        const escapeCsvField = (field: string) => {
          // Replace newlines dan cleanup whitespace
          const cleanField = field.replace(/\s+/g, " ").trim();
          if (
            cleanField.includes(",") ||
            cleanField.includes('"') ||
            cleanField.includes("\n")
          ) {
            return `"${cleanField.replace(/"/g, '""')}"`;
          }
          return cleanField;
        };

        return [
          index + 1,
          escapeCsvField(item.title || ""),
          escapeCsvField(item.url || ""),
          escapeCsvField(item.year || ""),
          escapeCsvField(item.category || ""),
        ].join(",");
      }),
    ];

    const csvContent = csvRows.join("\n");

    // Tulis ke file
    await Bun.write(filename, csvContent);
    console.log(`\n✅ Data berhasil disimpan ke: ${filename}`);
    console.log(`📊 Total records: ${data.length}`);

    return true;
  } catch (error: any) {
    console.error(`❌ Error writing CSV: ${error.message}`);
    return false;
  }
}

// Fungsi untuk mengekstrak tahun dari URL atau teks
function extractYear(text: string, url: string): string {
  // Coba ekstrak tahun dari URL terlebih dahulu (misalnya: 2025.html)
  const yearFromUrl = url.match(/(\d{4})\.html/);
  if (yearFromUrl && yearFromUrl[1]) {
    const year = parseInt(yearFromUrl[1]);
    if (year >= 1990 && year <= 2030) {
      // Validasi rentang tahun yang masuk akal
      return yearFromUrl[1];
    }
  }

  // Coba ekstrak tahun dari teks artikel (misalnya: "(2025)")
  const yearFromText = text.match(/\((\d{4})\)/);
  if (yearFromText && yearFromText[1]) {
    const year = parseInt(yearFromText[1]);
    if (year >= 1990 && year <= 2030) {
      // Validasi rentang tahun yang masuk akal
      return yearFromText[1];
    }
  }

  // Coba ekstrak tahun dari URL eprint (misalnya: /id/eprint/29710/)
  const yearFromEprint = url.match(/\/id\/eprint\/(\d+)\//);
  if (yearFromEprint && yearFromEprint[1]) {
    const eprintId = parseInt(yearFromEprint[1]);
    // Estimasi tahun berdasarkan ID eprint (ini adalah pendekatan heuristik)
    if (eprintId >= 29000) return "2025";
    if (eprintId >= 25000) return "2024";
    if (eprintId >= 20000) return "2023";
    if (eprintId >= 13000) return "2022";
    if (eprintId >= 1000) return "2021";
    if (eprintId >= 500) return "2020";
    if (eprintId >= 1) return "2019";
  }

  // Coba ekstrak tahun 4 digit dari teks apapun
  const anyYear = text.match(/\b(20\d{2})\b/);
  if (anyYear && anyYear[1]) {
    const year = parseInt(anyYear[1]);
    if (year >= 1990 && year <= 2030) {
      return anyYear[1];
    }
  }

  return ""; // Return kosong jika tidak bisa mengekstrak tahun
}

// Fungsi untuk menentukan kategori berdasarkan teks judul
function categorizeTitle(title: string): string {
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes("iot") || lowerTitle.includes("internet of things")) {
    return "IoT";
  } else if (lowerTitle.includes("sistem") || lowerTitle.includes("system")) {
    return "Sistem";
  } else if (
    lowerTitle.includes("analisis") ||
    lowerTitle.includes("analysis")
  ) {
    return "Analisis";
  } else if (
    lowerTitle.includes("implementasi") ||
    lowerTitle.includes("implementation")
  ) {
    return "Implementasi";
  } else if (lowerTitle.includes("desain") || lowerTitle.includes("design")) {
    return "Desain";
  } else if (
    lowerTitle.includes("keamanan") ||
    lowerTitle.includes("security")
  ) {
    return "Keamanan";
  } else if (
    lowerTitle.includes("jaringan") ||
    lowerTitle.includes("network")
  ) {
    return "Jaringan";
  } else if (
    lowerTitle.includes("monitoring") ||
    lowerTitle.includes("pemantauan")
  ) {
    return "Monitoring";
  } else if (lowerTitle.includes("web") || lowerTitle.includes("website")) {
    return "Web Development";
  } else if (lowerTitle.includes("mobile") || lowerTitle.includes("android")) {
    return "Mobile Development";
  } else {
    return "Umum";
  }
}

// Fungsi untuk scraping semua halaman dan mengumpulkan data lengkap
async function scrapeAllPagesData(baseUrl: string) {
  console.log("\n🚀 === MEMULAI SCRAPING SEMUA DATA ===");

  const allData: any[] = [];

  try {
    // Step 1: Dapatkan semua link HTML dari halaman utama
    const domScrapeResult = await scrapeWithDOMethods(baseUrl);
    if (!domScrapeResult) {
      console.log("❌ Tidak bisa mendapatkan link HTML dari halaman utama");
      return [];
    }

    // Step 2: Dapatkan semua link HTML, bukan hanya yang pertama
    const mainPageResponse = await fetch(baseUrl);
    const mainPageHtml = await mainPageResponse.text();
    const mainPageDom = new JSDOM(mainPageHtml);
    const mainPageDocument = mainPageDom.window.document;

    const menuContainer = mainPageDocument.querySelector(".ep_view_menu");
    if (!menuContainer) {
      console.log("❌ Menu container tidak ditemukan");
      return [];
    }

    const allLinks = menuContainer.querySelectorAll("li a");
    const htmlLinks = Array.from(allLinks).filter((link) => {
      const href = link.getAttribute("href") || "";
      return href.endsWith(".html");
    });

    console.log(`📋 Ditemukan ${htmlLinks.length} halaman untuk di-scrape`);

    // Step 3: Loop through semua halaman HTML
    for (let i = 0; i < htmlLinks.length; i++) {
      const link = htmlLinks[i];
      if (!link) continue; // Skip jika link undefined

      const href = link.getAttribute("href") || "";
      const text = link.textContent?.trim() || "";

      if (!href.endsWith(".html")) continue; // Skip jika bukan file HTML

      console.log(
        `\n📄 [${i + 1}/${htmlLinks.length}] Scraping: ${text} (${href})`
      );

      try {
        // Bangun URL lengkap
        const baseUrlWithSlash = baseUrl.endsWith("/")
          ? baseUrl
          : baseUrl + "/";
        const fullUrl = new URL(href, baseUrlWithSlash).toString();

        // Scrape halaman inner
        const innerPageResults = await scrapeInnerPage(fullUrl);

        if (innerPageResults && innerPageResults.length > 0) {
          console.log(`  ✅ Ditemukan ${innerPageResults.length} artikel`);

          // Proses setiap artikel
          innerPageResults.forEach((article) => {
            const yearFromUrl = extractYear(article.text, fullUrl);
            const yearFromArticle = extractYear(article.text, article.href);
            const category = categorizeTitle(article.text);

            // Prioritas tahun: dari artikel > dari URL halaman > dari teks link menu (jika berupa tahun)
            let finalYear = yearFromArticle || yearFromUrl;
            if (!finalYear && /^\d{4}$/.test(text)) {
              finalYear = text; // Gunakan teks link menu hanya jika itu adalah tahun 4 digit
            }

            allData.push({
              title: article.text.trim(),
              url: article.href,
              year: finalYear || "",
              category: category,
              sourcePage: fullUrl,
            });
          });
        } else {
          console.log(`  ⚠️ Tidak ada artikel ditemukan`);
        }

        // Delay untuk menghindari rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error: any) {
        console.log(`  ❌ Error scraping ${href}: ${error.message}`);
      }
    }

    console.log(`\n🎉 SELESAI! Total artikel dikumpulkan: ${allData.length}`);
    return allData;
  } catch (error: any) {
    console.error(`❌ Error dalam scraping semua data: ${error.message}`);
    return allData; // Return data yang sudah dikumpulkan sejauh ini
  }
}

// Fungsi utama untuk scraping dan export ke CSV
async function main() {
  try {
    console.log("🚀 === MEMULAI PROSES SCRAPING WEBSITE ===");

    // Jalankan workflow lengkap
    await runCompleteWorkflow();
  } catch (error: any) {
    console.error(`❌ Error dalam main function: ${error.message}`);
  }
}

// Jalankan fungsi utama jika file dijalankan langsung
if (import.meta.main) {
  main().catch(console.error);
}

// Fungsi untuk scraping detail artikel dari halaman eprint
async function scrapeArticleDetails(articleUrl: string) {
  try {
    console.log(`\n📖 Scraping artikel: ${articleUrl}`);

    const response = await fetch(articleUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // 1. Ekstrak title dari h1.ep_tm_pagetitle
    const titleElement = document.querySelector("h1.ep_tm_pagetitle");
    const title = titleElement?.textContent?.trim() || "";

    console.log(`  📋 Title: ${title.substring(0, 50)}...`);

    // 2. Ekstrak daftar dokumen
    const documents: Array<{ title: string; filename: string; link: string }> =
      [];
    const documentElements = document.querySelectorAll("a.ep_document_link");

    console.log(`  📄 Dokumen ditemukan: ${documentElements.length}`);

    documentElements.forEach((docLink, index) => {
      // Cari span.document_format dan span.document_filename dalam konteks yang sama
      const formatElement =
        docLink.querySelector("span.document_format") ||
        docLink.parentElement?.querySelector("span.document_format");
      const filenameElement =
        docLink.querySelector("span.document_filename") ||
        docLink.parentElement?.querySelector("span.document_filename");

      const format = formatElement?.textContent?.trim() || "";
      const filename = filenameElement?.textContent?.trim() || "";
      const link = docLink.getAttribute("href") || "";

      if (format || filename || link) {
        documents.push({
          title: format,
          filename: filename,
          link: link,
        });

        console.log(`    ${index + 1}. ${format} - ${filename} -> ${link}`);
      }
    });

    // 3. Ekstrak abstrak dari .ep_summary_content_main h2:contains('Abstract') + p
    let abstract = "";
    const summaryContainer = document.querySelector(".ep_summary_content_main");

    if (summaryContainer) {
      // Cari h2 yang mengandung 'Abstract'
      const headings = summaryContainer.querySelectorAll("h2");

      for (let i = 0; i < headings.length; i++) {
        const h2 = headings[i];
        if (h2 && h2.textContent?.toLowerCase().includes("abstract")) {
          // Ambil paragraf setelah heading Abstract
          let nextElement = h2.nextElementSibling as Element | null;
          while (nextElement && nextElement.tagName.toLowerCase() === "p") {
            abstract += nextElement.textContent?.trim() + " ";
            nextElement = nextElement.nextElementSibling as Element | null;
          }
          abstract = abstract.trim();
          break; // Keluar dari loop setelah menemukan Abstract
        }
      }
    }

    console.log(`  📝 Abstract: ${abstract.substring(0, 100)}...`);

    return {
      url: articleUrl,
      title: title,
      documents: documents,
      abstract: abstract,
    };
  } catch (error: any) {
    console.error(`❌ Error scraping article ${articleUrl}: ${error.message}`);
    return null;
  }
}

// Fungsi untuk menulis detail artikel ke CSV
async function writeArticleDetailsToCSV(
  articleDetails: any[],
  filename: string
) {
  try {
    console.log(
      `\n💾 Menyimpan ${articleDetails.length} detail artikel ke CSV...`
    );

    // Header CSV untuk detail artikel
    const headers = [
      "Index",
      "Article_URL",
      "Title",
      "Document_Count",
      "Document_Details", // JSON string berisi semua dokumen
      "Abstract",
    ];

    // Buat baris CSV
    const csvRows = [
      headers.join(","), // Header row
      ...articleDetails.map((article, index) => {
        // Escape koma, tanda kutip, dan newline dalam data
        const escapeCsvField = (field: string) => {
          if (!field) return "";
          // Replace newlines dan cleanup whitespace
          const cleanField = field.replace(/\s+/g, " ").trim();
          if (
            cleanField.includes(",") ||
            cleanField.includes('"') ||
            cleanField.includes("\n")
          ) {
            return `"${cleanField.replace(/"/g, '""')}"`;
          }
          return cleanField;
        };

        // Format document details sebagai JSON string
        const documentDetails = JSON.stringify(article.documents || []);

        return [
          index + 1,
          escapeCsvField(article.url || ""),
          escapeCsvField(article.title || ""),
          article.documents ? article.documents.length : 0,
          escapeCsvField(documentDetails),
          escapeCsvField(article.abstract || ""),
        ].join(",");
      }),
    ];

    const csvContent = csvRows.join("\n");

    // Tulis ke file
    await Bun.write(filename, csvContent);
    console.log(`\n✅ Detail artikel berhasil disimpan ke: ${filename}`);
    console.log(`📊 Total artikel: ${articleDetails.length}`);

    // Statistik
    const totalDocuments = articleDetails.reduce(
      (sum, article) =>
        sum + (article.documents ? article.documents.length : 0),
      0
    );
    const articlesWithAbstract = articleDetails.filter(
      (article) => article.abstract && article.abstract.length > 0
    ).length;

    console.log(`📄 Total dokumen: ${totalDocuments}`);
    console.log(`📝 Artikel dengan abstrak: ${articlesWithAbstract}`);

    return true;
  } catch (error: any) {
    console.error(`❌ Error writing article details CSV: ${error.message}`);
    return false;
  }
}

// Fungsi untuk scraping semua detail artikel
async function scrapeAllArticleDetails(
  articleUrls: string[],
  maxArticles?: number
) {
  console.log(`\n🔍 === MEMULAI SCRAPING DETAIL ARTIKEL ===`);

  const limit = maxArticles || articleUrls.length;
  const urlsToProcess = articleUrls.slice(0, limit);

  console.log(
    `📋 Akan memproses ${urlsToProcess.length} artikel dari ${articleUrls.length} total`
  );

  // Estimasi waktu
  const estimatedMinutes = Math.ceil((urlsToProcess.length * 2.5) / 60);
  console.log(`⏱️  Estimasi waktu: ~${estimatedMinutes} menit`);

  const articleDetails = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < urlsToProcess.length; i++) {
    const url = urlsToProcess[i];
    if (!url) continue; // Skip jika URL undefined

    console.log(`\n[${i + 1}/${urlsToProcess.length}] Processing: ${url}`);

    try {
      const details = await scrapeArticleDetails(url);
      if (details) {
        articleDetails.push(details);
        successCount++;
        console.log(`  ✅ Berhasil`);
      } else {
        errorCount++;
        console.log(`  ❌ Gagal`);
      }

      // Progress update setiap 10 artikel
      if ((i + 1) % 10 === 0) {
        const progress = (((i + 1) / urlsToProcess.length) * 100).toFixed(1);
        console.log(
          `\n📊 Progress: ${progress}% (${i + 1}/${
            urlsToProcess.length
          }) | ✅ ${successCount} | ❌ ${errorCount}`
        );

        // Simpan progress setiap interval yang ditentukan untuk backup
        if (
          (i + 1) % CONFIG.BACKUP_INTERVAL === 0 &&
          articleDetails.length > 0
        ) {
          const tempTimestamp = new Date()
            .toISOString()
            .replace(/[:.]/g, "-")
            .slice(0, 19);
          const tempFilename = `backup_artikel_${i + 1}_${tempTimestamp}.csv`;
          console.log(`💾 Menyimpan backup ke: ${tempFilename}`);
          await writeArticleDetailsToCSV(articleDetails, tempFilename);
        }
      }

      // Delay untuk menghindari rate limiting
      await new Promise((resolve) =>
        setTimeout(resolve, CONFIG.DELAY_BETWEEN_REQUESTS)
      );
    } catch (error: any) {
      errorCount++;
      console.error(`  ❌ Error processing ${url}: ${error.message}`);
    }
  }

  console.log(
    `\n🎉 Selesai! Berhasil mengumpulkan detail ${articleDetails.length} artikel`
  );
  console.log(
    `📊 Statistik final: ✅ ${successCount} berhasil | ❌ ${errorCount} gagal`
  );

  // Simpan ke CSV
  if (articleDetails.length > 0) {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const csvFilename = `detail_artikel_${timestamp}.csv`;

    await writeArticleDetailsToCSV(articleDetails, csvFilename);

    // Preview data
    console.log("\n📋 Preview detail artikel (3 pertama):");
    articleDetails.slice(0, 3).forEach((article, index) => {
      console.log(`${index + 1}. ${article.title.substring(0, 50)}...`);
      console.log(`   📄 Dokumen: ${article.documents.length}`);
      console.log(`   📝 Abstrak: ${article.abstract.length} karakter`);
    });
  }

  return articleDetails;
}

// --- Contoh Penggunaan (GANTI DENGAN URL DAN JALUR SPESIFIK ANDA) ---
// GANTI DENGAN URL WEBSITE YANG INGIN ANDA SCRAPE
const websiteUrl = "https://eprints.amikom.ac.id/view/divisions/tk"; // Ganti dengan URL sebenarnya!

// XPath target yang fokus pada link .html dalam li di class ep_view_menu
const targetXPath =
  "//*[@class='ep_view_menu']//li//a[contains(@href, '.html')][1]";

// Fungsi utama yang terintegrasi untuk menjalankan seluruh workflow
async function runCompleteWorkflow() {
  console.log("🚀 === MEMULAI SCRAPING EPRINTS AMIKOM ===\n");

  try {
    // 1. Scraping daftar artikel utama
    console.log("📋 LANGKAH 1: Scraping daftar artikel...");
    const articles = await scrapeAllPagesData(CONFIG.BASE_URL);

    if (articles.length === 0) {
      console.log("❌ Tidak ada artikel ditemukan. Menghentikan proses.");
      return;
    }

    // 2. Simpan daftar artikel utama ke CSV
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);

    const mainCsvFilename = `artikel_utama_${timestamp}.csv`;
    await writeToCSV(articles, mainCsvFilename);

    // 3. Ekstrak URL artikel untuk detail scraping
    const articleUrls = articles.map((article: any) => article.url);
    console.log(
      `\n📄 Ditemukan ${articleUrls.length} URL artikel untuk detail scraping`
    );

    // 4. Konfigurasi scraping
    const maxArticles = CONFIG.MAX_ARTICLES_TO_SCRAPE;

    console.log("\n🤔 Konfigurasi scraping detail artikel:");
    console.log(`   Total artikel tersedia: ${articleUrls.length}`);

    if (maxArticles === null) {
      console.log(`   🎯 Mode: SCRAPE SEMUA ${articleUrls.length} artikel`);
      console.log(
        `   ⚠️  Estimasi waktu: ~${Math.ceil(
          (articleUrls.length * 2.5) / 60
        )} menit`
      );
      console.log(
        `   💾 Backup otomatis setiap ${CONFIG.BACKUP_INTERVAL} artikel`
      );
    } else {
      console.log(`   🎯 Mode: TESTING dengan ${maxArticles} artikel pertama`);
      console.log(
        `   ⚠️  Estimasi waktu: ~${Math.ceil((maxArticles * 2.5) / 60)} menit`
      );
    }

    // 5. Scraping detail artikel
    console.log("\n📖 LANGKAH 2: Scraping detail artikel...");
    const articleDetails = await scrapeAllArticleDetails(
      articleUrls,
      maxArticles || undefined
    );

    // 6. Selesai
    console.log("\n🎉 === SCRAPING SELESAI ===");
    console.log(`✅ Daftar artikel utama: ${mainCsvFilename}`);
    if (articleDetails.length > 0) {
      console.log(`✅ Detail artikel: detail_artikel_${timestamp}.csv`);
    }
    console.log(`📊 Total artikel utama: ${articles.length}`);
    console.log(`📊 Total detail artikel: ${articleDetails.length}`);
  } catch (error: any) {
    console.error(`❌ Error dalam workflow: ${error.message}`);
  }
}

// Export fungsi untuk dapat dipanggil dari luar
export { runCompleteWorkflow, scrapeAllPagesData, scrapeAllArticleDetails };

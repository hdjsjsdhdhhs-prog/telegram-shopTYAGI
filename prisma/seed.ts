import { PrismaClient } from "@prisma/client";
import { slugify } from "../src/lib/format";

const prisma = new PrismaClient();

async function main() {
  const categoriesData = [
    {
      name: "Жидкости",
      imageUrl: "https://images.unsplash.com/photo-1567361808960-dec9cb578182?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "Устройства",
      imageUrl: "https://images.unsplash.com/photo-1602192509154-0b900ee1f851?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "Одноразки",
      imageUrl: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=600&q=80",
    },
    {
      name: "Аксессуары",
      imageUrl: "https://images.unsplash.com/photo-1560346740-e9c2c0e1d54a?auto=format&fit=crop&w=600&q=80",
    },
  ];

  const categories: Record<string, string> = {};
  for (const c of categoriesData) {
    const slug = slugify(c.name);
    const cat = await prisma.category.upsert({
      where: { slug },
      create: { name: c.name, slug, imageUrl: c.imageUrl, sortOrder: 0 },
      update: { name: c.name, imageUrl: c.imageUrl },
    });
    categories[c.name] = cat.id;
  }

  const productsData = [
    {
      name: "HQD Cuvie Plus 1200",
      price: 99000,
      oldPrice: 119000,
      salePrice: 89000,
      saleBadge: "Sale",
      isSale: true,
      category: "Одноразки",
      imageUrl: "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=600&q=80",
      description: "Одноразовый pod-набор с 5% никотина. До 1200 затяжек.",
    },
    {
      name: "Elf Bar BC5000",
      price: 149000,
      category: "Одноразки",
      imageUrl: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80",
      description: "Перезаряжаемый, до 5000 затяжек, аккумулятор 650 mAh.",
    },
    {
      name: "Жидкость BLVK Cloud Salt 30ml",
      price: 79000,
      category: "Жидкости",
      imageUrl: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=600&q=80",
      description: "Соляной никотин 20 мг/мл, фруктовый микс.",
    },
    {
      name: "Vaporesso XROS 3 Pod Kit",
      price: 269000,
      category: "Устройства",
      imageUrl: "https://images.unsplash.com/photo-1572635148818-ef6fd45eb394?auto=format&fit=crop&w=600&q=80",
      description: "Pod-система 1000 mAh с регулируемым обдувом.",
    },
    {
      name: "Сменный картридж XROS 0.8Ω",
      price: 39000,
      category: "Аксессуары",
      imageUrl: "https://images.unsplash.com/photo-1604908554007-1e9bf2cb1c97?auto=format&fit=crop&w=600&q=80",
      description: "Сменный pod-картридж 2 ml, сопротивление 0.8 Ом.",
    },
    {
      name: "Зарядка Type-C 1A",
      price: 19000,
      category: "Аксессуары",
      imageUrl: "https://images.unsplash.com/photo-1583225154070-ddc70778e3d5?auto=format&fit=crop&w=600&q=80",
      description: "Универсальный кабель для зарядки.",
    },
  ];

  for (const p of productsData) {
    const categoryId = categories[p.category];
    if (!categoryId) continue;
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (existing) continue;
    await prisma.product.create({
      data: {
        name: p.name,
        description: p.description,
        price: p.price,
        oldPrice: p.oldPrice ?? null,
        salePrice: p.salePrice ?? null,
        saleBadge: p.saleBadge ?? null,
        isSale: p.isSale ?? false,
        currency: "RUB",
        imageUrl: p.imageUrl,
        categoryId,
      },
    });
  }

  console.log("Seed complete:", {
    categories: Object.keys(categories).length,
    products: productsData.length,
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

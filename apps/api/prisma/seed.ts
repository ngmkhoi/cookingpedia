import argon2 from "argon2";
import { PrismaClient, RecipeDifficulty, RecipeStatus, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const sampleRecipes = [
  {
    slug: "charred-lemongrass-pork",
    title: "Charred lemongrass pork",
    shortDescription: "Smoky pork with sharp herbs and caramel edges.",
    category: "Dinner",
    cuisine: "Vietnamese",
    difficulty: RecipeDifficulty.MEDIUM,
    coverImageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1600&q=80",
    bookmarkCount: 18,
    ratingAverage: 4.9,
    prepMinutes: 20,
    cookMinutes: 25,
    servings: 4,
    locale: "VI" as const,
    ingredients: [
      { name: "Pork shoulder", quantity: 800, unit: "g", sortOrder: 1 },
      { name: "Lemongrass", quantity: 4, unit: "stalks", sortOrder: 2 }
    ],
    steps: [
      { stepNumber: 1, instruction: "Marinate the pork with lemongrass and fish sauce." },
      { stepNumber: 2, instruction: "Grill over high heat until charred and glossy." }
    ]
  },
  {
    slug: "egg-coffee-hanoi-style",
    title: "Egg coffee, Hanoi style",
    shortDescription: "Bitter coffee under a sweet, airy egg cream cap.",
    category: "Drinks",
    cuisine: "Vietnamese",
    difficulty: RecipeDifficulty.EASY,
    coverImageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=80",
    bookmarkCount: 14,
    ratingAverage: 4.7,
    prepMinutes: 10,
    cookMinutes: 5,
    servings: 2,
    locale: "VI" as const,
    ingredients: [
      { name: "Egg yolks", quantity: 2, unit: "pcs", sortOrder: 1 },
      { name: "Robusta coffee", quantity: 120, unit: "ml", sortOrder: 2 }
    ],
    steps: [
      { stepNumber: 1, instruction: "Whip the yolks with condensed milk until thick." },
      { stepNumber: 2, instruction: "Pour over hot coffee and serve immediately." }
    ]
  },
  {
    slug: "ginger-scallion-noodles",
    title: "Ginger scallion noodles",
    shortDescription: "Springy noodles coated in a bright aromatic oil.",
    category: "Lunch",
    cuisine: "Chinese",
    difficulty: RecipeDifficulty.EASY,
    coverImageUrl: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=1600&q=80",
    bookmarkCount: 11,
    ratingAverage: 4.6,
    prepMinutes: 12,
    cookMinutes: 10,
    servings: 2,
    locale: "EN" as const,
    ingredients: [
      { name: "Fresh noodles", quantity: 300, unit: "g", sortOrder: 1 },
      { name: "Scallions", quantity: 6, unit: "stalks", sortOrder: 2 }
    ],
    steps: [
      { stepNumber: 1, instruction: "Cook noodles until springy and drain well." },
      { stepNumber: 2, instruction: "Toss with hot ginger scallion oil and season." }
    ]
  },
  {
    slug: "coconut-pandan-rice-pudding",
    title: "Coconut pandan rice pudding",
    shortDescription: "Soft rice cooked down with coconut milk and pandan.",
    category: "Dessert",
    cuisine: "Vietnamese",
    difficulty: RecipeDifficulty.EASY,
    coverImageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1600&q=80",
    bookmarkCount: 9,
    ratingAverage: 4.5,
    prepMinutes: 10,
    cookMinutes: 35,
    servings: 4,
    locale: "VI" as const,
    ingredients: [
      { name: "Jasmine rice", quantity: 180, unit: "g", sortOrder: 1 },
      { name: "Coconut milk", quantity: 400, unit: "ml", sortOrder: 2 }
    ],
    steps: [
      { stepNumber: 1, instruction: "Simmer rice slowly with pandan and coconut milk." },
      { stepNumber: 2, instruction: "Finish thick and glossy, then cool slightly." }
    ]
  },
  {
    slug: "crispy-morning-banquette",
    title: "Crispy morning baguette board",
    shortDescription: "A quick breakfast board with eggs, herbs, and buttered toast.",
    category: "Breakfast",
    cuisine: "French-Vietnamese",
    difficulty: RecipeDifficulty.EASY,
    coverImageUrl: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&w=1600&q=80",
    bookmarkCount: 7,
    ratingAverage: 4.4,
    prepMinutes: 8,
    cookMinutes: 8,
    servings: 2,
    locale: "EN" as const,
    ingredients: [
      { name: "Baguette", quantity: 1, unit: "loaf", sortOrder: 1 },
      { name: "Eggs", quantity: 2, unit: "pcs", sortOrder: 2 }
    ],
    steps: [
      { stepNumber: 1, instruction: "Toast the baguette until deeply crisp." },
      { stepNumber: 2, instruction: "Serve with soft eggs, herbs, and salted butter." }
    ]
  }
] as const;

const pendingRecipe = {
  slug: "pending-black-pepper-chicken",
  title: "Pending black pepper chicken",
  shortDescription: "A queued moderation sample with pepper heat and glossy sauce.",
  category: "Dinner",
  cuisine: "Vietnamese",
  difficulty: RecipeDifficulty.MEDIUM,
  coverImageUrl: "https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=1600&q=80",
  bookmarkCount: 0,
  ratingAverage: 0,
  prepMinutes: 18,
  cookMinutes: 16,
  servings: 3,
  locale: "EN" as const,
  ingredients: [
    { name: "Chicken thigh", quantity: 600, unit: "g", sortOrder: 1 },
    { name: "Black pepper", quantity: 2, unit: "tbsp", sortOrder: 2 }
  ],
  steps: [
    { stepNumber: 1, instruction: "Marinate the chicken with soy and black pepper." },
    { stepNumber: 2, instruction: "Reduce in the pan until lacquered." }
  ]
} as const;

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@cookpedia.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "AdminPass123!";
  const username = process.env.SEED_ADMIN_USERNAME ?? "cookpedia-admin";
  const displayName = process.env.SEED_ADMIN_DISPLAY_NAME ?? "Cookpedia Admin";

  await prisma.user.upsert({
    where: { email },
    update: {
      role: UserRole.ADMIN,
      username,
      displayName
    },
    create: {
      email,
      username,
      displayName,
      role: UserRole.ADMIN,
      passwordHash: await argon2.hash(password, { type: argon2.argon2id })
    }
  });

  const editor = await prisma.user.upsert({
    where: { email: "editor@cookpedia.local" },
    update: {
      username: "cookpedia-editor",
      displayName: "Cookpedia Editor"
    },
    create: {
      email: "editor@cookpedia.local",
      username: "cookpedia-editor",
      displayName: "Cookpedia Editor",
      role: UserRole.USER,
      passwordHash: await argon2.hash("EditorPass123!", { type: argon2.argon2id })
    }
  });

  await prisma.recipe.deleteMany({
    where: {
      slug: {
        in: [...sampleRecipes.map((recipe) => recipe.slug), pendingRecipe.slug]
      }
    }
  });

  for (const recipe of sampleRecipes) {
    await prisma.recipe.create({
      data: {
        authorId: editor.id,
        title: recipe.title,
        slug: recipe.slug,
        shortDescription: recipe.shortDescription,
        prepMinutes: recipe.prepMinutes,
        cookMinutes: recipe.cookMinutes,
        servings: recipe.servings,
        coverImageUrl: recipe.coverImageUrl,
        category: recipe.category,
        cuisine: recipe.cuisine,
        difficulty: recipe.difficulty,
        locale: recipe.locale,
        status: RecipeStatus.PUBLISHED,
        bookmarkCount: recipe.bookmarkCount,
        ratingAverage: recipe.ratingAverage,
        ratingCount: Math.max(1, Math.round(recipe.ratingAverage)),
        images: {
          create: [{ imageUrl: recipe.coverImageUrl, sortOrder: 1 }]
        },
        ingredients: {
          create: [...recipe.ingredients]
        },
        steps: {
          create: [...recipe.steps]
        }
      }
    });
  }

  await prisma.recipe.create({
    data: {
      authorId: editor.id,
      title: pendingRecipe.title,
      slug: pendingRecipe.slug,
      shortDescription: pendingRecipe.shortDescription,
      prepMinutes: pendingRecipe.prepMinutes,
      cookMinutes: pendingRecipe.cookMinutes,
      servings: pendingRecipe.servings,
      coverImageUrl: pendingRecipe.coverImageUrl,
      category: pendingRecipe.category,
      cuisine: pendingRecipe.cuisine,
      difficulty: pendingRecipe.difficulty,
      locale: pendingRecipe.locale,
      status: RecipeStatus.PENDING,
      submittedAt: new Date(),
      images: {
        create: [{ imageUrl: pendingRecipe.coverImageUrl, sortOrder: 1 }]
      },
      ingredients: {
        create: [...pendingRecipe.ingredients]
      },
      steps: {
        create: [...pendingRecipe.steps]
      }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

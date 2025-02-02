import { NextRequest, NextResponse } from "next/server";
import { getLogsCollection } from "@/src/db/logs";
import { getAccountsCollection } from "@/src/db/accounts";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const prefix = searchParams.get("prefix");
  const accountId = searchParams.get("accountId");

  if (!prefix) {
    return NextResponse.json({ error: "Prefix is required" }, { status: 400 });
  }

  try {
    const logsCollection = await getLogsCollection();
    const accountsCollection = await getAccountsCollection();
    
    // Получаем все аккаунты для префикса
    const accounts = await accountsCollection
      .find({ prefix })
      .toArray();

    // Разделяем аккаунты на группы
    const originalAccounts = accounts.filter(acc => !acc.parentAccountId);
    const derivedAccounts = accounts.filter(acc => acc.parentAccountId);

    // Подготавливаем базовый фильтр для логов
    const baseMatch = {
      "metadata.prefix": prefix,
      ...(accountId && { "metadata.accountId": accountId }),
    };

    // Получаем общую статистику по логам
    const [statsResult] = await logsCollection
      .aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            byLevel: {
              $push: "$level"
            }
          }
        }
      ])
      .toArray();

    // Получаем активность за последние 7 дней
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activityResult = await logsCollection
      .aggregate([
        {
          $match: {
            ...baseMatch,
            timestamp: { $gte: sevenDaysAgo.toISOString() }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: { $dateFromString: { dateString: "$timestamp" } } } },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id": 1 } }
      ])
      .toArray();

    // Форматируем результат по уровням логов
    const levelCounts = statsResult?.byLevel.reduce((acc: Record<string, number>, level: string) => {
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      total: statsResult?.total || 0,
      byLevel: {
        error: levelCounts?.error || 0,
        info: levelCounts?.info || 0,
        warn: levelCounts?.warn || 0
      },
      recentActivity: activityResult.map(item => ({
        date: item._id,
        count: item.count
      })),
      accounts: {
        originalAccounts,
        derivedAccounts
      }
    });
  } catch (error) {
    console.error("Error fetching logs stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs statistics" },
      { status: 500 }
    );
  }
} 
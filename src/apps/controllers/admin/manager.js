const orderModel = require("../../models/order");
const productModel = require("../../models/product");
const { format } = require("date-fns");

// lấy dữ liệu nhập sản phẩm theo ngày và sản phẩm
const getTotalPurchaseByDayAndProduct = async() => {
  try {
    const result = await productModel.aggregate([
      // Đầu tiên, unwind purchaseHistory để làm phẳng mảng
      { $unwind: "$purchaseHistory" },
      // Nhóm theo ngày và slug của sản phẩm, tính tổng quantity
      {
        $group: {
          _id: {
            day: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: { $toDate: "$purchaseHistory.date" },
              },
            },
            product: "$name",
          },
          totalQuantity: { $sum: "$purchaseHistory.quantity" },
        },
      },
      // Đưa kết quả vào một object mới
      {
        $project: {
          _id: 0,
          day: "$_id.day",
          product: "$_id.product",
          totalQuantity: 1,
        },
      },
    ]);
    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

// lấy dữ liệu bán sản phẩm theo ngày và sản phẩm
const getSoldItemsByProductNameAndTime = async() => {
  try {
    // Truy vấn số lượng đã bán cho mỗi tên sản phẩm và thời gian
    const soldItemsByProductNameAndTime = await orderModel.aggregate([
      {
        $match: {
          status: "Đã giao", // Chỉ lấy các đơn hàng đã giao
        },
      },
      {
        $unwind: "$items", // Tách mỗi mục hàng thành một document riêng biệt
      },
      {
        $match: {
          "items.qty": { $gt: 0 }, // Loại bỏ các mục hàng có số lượng nhỏ hơn hoặc bằng 0
        },
      },
      
      {
        $group: {
          _id: {
            productName: "$items.name", // Nhóm theo tên sản phẩm
            year: { $year: "$createdAt" }, // Nhóm theo năm
            month: { $month: "$createdAt" }, // Nhóm theo tháng
            day: { $dayOfMonth: "$createdAt" }, // Nhóm theo ngày
          },
          totalQuantity: { $sum: "$items.qty" }, // Tính tổng số lượng đã bán
          productName: { $first: "$items.name" }, // Giữ lại tên sản phẩm
        },
      },
      {
        $project: {
          _id: 0,
          productName: 1,
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                  day: "$_id.day",
                },
              },
            },
          },
          totalQuantity: 1,
        },
      },
    ]);

    return soldItemsByProductNameAndTime;
  } catch (error) {
    console.error(
      "Lỗi khi tính toán số lượng sản phẩm đã bán theo tên sản phẩm và thời gian:",
      error
    );
    throw error;
  }
};

// tổng số lượng sản phẩm bán ra theo sản phẩm (Pie chart)
const getProductSales = async () => {
  try {
    const productSales = await orderModel.aggregate([
      // Match orders with status "Đã giao"
      { $match: { status: "Đã giao" } },
      // Unwind the items array to treat each item as a separate document
      { $unwind: "$items" },
      // Group by product name and sum up the total quantity sold
      {
        $group: {
          _id: "$items.name",
          totalQuantitySold: { $sum: "$items.qty" },
        },
      },
      // Project to reshape the output
      {
        $project: {
          productName: "$_id",
          totalQuantitySold: 1,
          _id: 0,
        },
      },
    ]);

    return productSales;
  } catch (error) {
    console.error("Error fetching product sales:", error);
    throw error;
  }
};

// tổng số lượng sản phẩm nhập vào theo sản phẩm (Pie chart)
const getTotalPurchaseHistoryByProduct = async () => {
  try {
    const result = await productModel.aggregate([
      {
        $unwind: "$purchaseHistory", // "Giải phóng" mỗi mục trong mảng purchaseHistory
      },
      {
        $group: {
          _id: "$_id", // Nhóm các sản phẩm theo _id
          name: { $first: "$name" }, // Lấy tên sản phẩm (chỉ cần một lần)
          totalQuantity: { $sum: "$purchaseHistory.quantity" }, // Tính tổng số lượng
        },
      },
    ]);

    return result;
  } catch (error) {
    console.error(
      "Error occurred while fetching total quantity by product:",
      error
    );
    throw error;
  }
};

// lấy theo doanh thu ngày ngày tuỳ chọn theo thời gian
// const getRevenueByCustomDates = async (startDate, endDate) => {
//   try {
//     // Tạo mảng các ngày trong khoảng thời gian
//     const datesInRange = [];
//     const currentDate = new Date(startDate);
//     while (currentDate <= endDate) {
//       datesInRange.push(new Date(currentDate));
//       currentDate.setDate(currentDate.getDate() + 1);
//     }

//     // Truy vấn doanh thu cho từng ngày trong khoảng thời gian
//     const revenueOfCustomDates = await Promise.all(
//       datesInRange.map(async (date) => {
//         const startOfDate = new Date(
//           date.getFullYear(),
//           date.getMonth(),
//           date.getDate(),
//           0,
//           0,
//           0
//         );
//         const endOfDate = new Date(
//           date.getFullYear(),
//           date.getMonth(),
//           date.getDate(),
//           23,
//           59,
//           59
//         );

//         // Truy vấn doanh thu cho ngày hiện tại
//         const revenueForDate = await orderModel.aggregate([
//           {
//             $match: {
//               createdAt: {
//                 $gte: startOfDate,
//                 $lte: endOfDate,
//               },
//               status: "Đã giao",
//             },
//           },
//           {
//             $addFields: {
//               validItems: {
//                 $filter: {
//                   input: "$items",
//                   as: "item",
//                   cond: { $ne: ["$$item", {}] },
//                 },
//               },
//             },
//           },
//           {
//             $unwind: "$validItems",
//           },
//           {
//             $group: {
//               _id: null,
//               totalRevenue: {
//                 $sum: { $multiply: ["$validItems.price", "$validItems.qty"] },
//               },
//             },
//           },
//           {
//             $project: {
//               _id: 0,
//               totalRevenue: 1,
//             },
//           },
//         ]);

//         // Định dạng ngày
//         const formattedDate = format(date, "dd/MM/yyyy");
//         // Trả về kết quả doanh thu cho ngày hiện tại
//         return {
//           date: formattedDate,
//           totalRevenue:
//             revenueForDate.length > 0 ? revenueForDate[0].totalRevenue : 0,
//         };
//       })
//     );

//     return revenueOfCustomDates;
//   } catch (error) {
//     console.error("Lỗi khi tính toán doanh thu theo ngày tuỳ chọn:", error);
//     throw error;
//   }
// };

// xử lý thời gian
// const handleTime = async (req, res) => {
//   const { startDate, endDate } = req.body;
//   const startTime = new Date(startDate);
//   const endTime = new Date(endDate);
//   const result = await getRevenueByCustomDates(startTime, endTime);
//   const resulttotalRevenue = result.map((e) => e.totalRevenue);
//   const resulttotalDate = result.map((e) => e.date);

//   let dataDateChoose = {
//     chartType: "bar",
//     labels: resulttotalDate,
//     datasetLabel: "Number of Votes",
//     data: resulttotalRevenue,
//     backgroundColor: "rgba(255, 99, 132, 0.2)",
//     borderColor: "rgba(255, 99, 132, 1)",
//   };
//   // req.flash({dataDateChoose})
//   res.json(dataDateChoose);
// };

const index = async (req, res) => {
  // Pie chart
  const generateColors = (numColors) => {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
      // Tạo màu ngẫu nhiên
      const color = `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(
        Math.random() * 256
      )}, ${Math.floor(Math.random() * 256)})`;
      colors.push(color);
    }
    return colors;
  };

  // data pieChart sales
  const dataSalesByProduct = await getProductSales();
  const nameProduct = dataSalesByProduct.map((item) => item.productName);
  const quantitySale = dataSalesByProduct.map((item) => item.totalQuantitySold);
  const PieChart = {
    type: "pie",
    data: {
      labels: nameProduct,
      datasets: [
        {
          label: "My First Dataset",
          data: quantitySale,
          backgroundColor: generateColors(nameProduct.length),
          hoverOffset: 4,
        },
      ],
    },
  };

  // data pieChart import product
  const dataImportProduct = await getTotalPurchaseHistoryByProduct();
  const nameProductRestock = dataImportProduct.map((item) => item.name);
  const quantityRestock = dataImportProduct.map((item) => item.totalQuantity);
  const dataRestock = {
    type: "pie",
    data: {
      labels: nameProductRestock,
      datasets: [
        {
          label: "My First Dataset",
          data: quantityRestock,
          backgroundColor: generateColors(nameProductRestock.length),
          hoverOffset: 4,
        },
      ],
    },
  };

  const dataImportProductTable = await getTotalPurchaseByDayAndProduct();
  dataImportProductTable.sort((a, b) => {
    // Sắp xếp theo ngày tăng dần
    return new Date(a.day) - new Date(b.day);
  });
  
  const dataSoldProductTable = await getSoldItemsByProductNameAndTime();
  dataSoldProductTable.sort((a, b) => {
    // Sắp xếp theo ngày tăng dần
    return new Date(a.date) - new Date(b.date);
  });


  res.render("admin/manager/manager", {
    dataImportProductTable,
    dataSoldProductTable,
    PieChart,
    dataRestock,
  });
};

module.exports = {
  index,
};

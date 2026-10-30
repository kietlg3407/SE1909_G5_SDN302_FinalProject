const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const Product = require('../src/models/productModel');

const categories = ['Áo', 'Quần', 'Váy', 'Áo khoác', 'Phụ kiện', 'Giày dép', 'Khác'];

const dataByCat = {
  'Áo': [
    { name: 'Áo Thun Trơn Cổ Tròn Cotton 100%', price: 159000, op: 199000, b: 'CLOSET Studio', img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800' },
    { name: 'Áo Thun Oversize Streetwear Tokyo', price: 220000, op: 280000, b: 'CLOSET Studio', img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800' },
    { name: 'Áo Polo Pique Phối Bo Cổ Cổ Điển', price: 269000, op: 349000, b: 'Uniqlo Style', img: 'https://images.unsplash.com/photo-1625910513413-5bc2178e24be?w=800' },
    { name: 'Áo Sơ Mi Trắng Oxford Dài Tay', price: 320000, op: 399000, b: 'Routine Minimal', img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800' },
    { name: 'Áo Sơ Mi Cổ Cuba Họa Tiết Tropical', price: 289000, op: 360000, b: 'CLOSET Studio', img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800' },
    { name: 'Áo Len Dệt Kim Mỏng Cổ Lọ', price: 350000, op: 450000, b: 'Routine Minimal', img: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800' },
    { name: 'Áo Sơ Mi Kẻ Sọc Xanh Form Rộng', price: 310000, op: 390000, b: 'Routine Minimal', img: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=800' },
    { name: 'Áo Hoodie Nỉ Bông Đen Basic', price: 390000, op: 490000, b: 'CLOSET Studio', img: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800' },
    { name: 'Áo Ba Lỗ Tanktop Thể Thao Tập Gym', price: 129000, op: 179000, b: 'Nike Sportswear', img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800' },
    { name: 'Áo Thun Dài Tay Cổ Tim Cotton', price: 189000, op: 240000, b: 'Uniqlo Style', img: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800' },
  ],
  'Quần': [
    { name: 'Quần Jeans Slimfit Co Giãn 4 Chiều', price: 389000, op: 489000, b: 'Levi Classic', img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800' },
    { name: 'Quần Kaki Ống Đứng Chinos Công Sở', price: 350000, op: 420000, b: 'Routine Minimal', img: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800' },
    { name: 'Quần Tây Âu Xếp Ly Dáng Rộng', price: 420000, op: 520000, b: 'Zara Man', img: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800' },
    { name: 'Quần Short Kaki Túi Hộp Đa Năng', price: 219000, op: 280000, b: 'CLOSET Studio', img: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800' },
    { name: 'Quần Jogger Nỉ Thể Thao Bo Gấu', price: 280000, op: 350000, b: 'Nike Sportswear', img: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800' },
    { name: 'Quần Jeans Ống Rộng Straight Leg', price: 410000, op: 510000, b: 'Levi Classic', img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800' },
    { name: 'Quần Short Thể Thao Dù 2 Lớp Chạy Bộ', price: 199000, op: 260000, b: 'Nike Sportswear', img: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800' },
    { name: 'Quần Kaki Túi Hộp Phong Cách Lính Cargo', price: 395000, op: 490000, b: 'CLOSET Studio', img: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800' },
    { name: 'Quần Tây Baggy Công Sở Cạp Cao', price: 360000, op: 450000, b: 'Routine Minimal', img: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800' },
    { name: 'Quần Jeans Rách Gối Cá Tính Streetwear', price: 430000, op: 550000, b: 'Levi Classic', img: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800' },
  ],
  'Váy': [
    { name: 'Đầm Hoa Nhí Vintage Dáng Dài Thắt Eo', price: 420000, op: 550000, b: 'Zara Woman', img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800' },
    { name: 'Chân Váy Xếp Ly Tennis Năng Động', price: 230000, op: 290000, b: 'CLOSET Studio', img: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800' },
    { name: 'Đầm Bodycon Dự Tiệc Cổ Vuông', price: 360000, op: 480000, b: 'Zara Woman', img: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800' },
    { name: 'Chân Váy Chữ A Công Sở Dáng Lửng', price: 299000, op: 380000, b: 'Routine Minimal', img: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800' },
    { name: 'Đầm Suông Linen Cổ Yếm Mát Mẻ', price: 340000, op: 430000, b: 'Uniqlo Style', img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800' },
    { name: 'Chân Váy Jeans Chữ A Xẻ Tà Trước', price: 320000, op: 410000, b: 'Levi Classic', img: 'https://images.unsplash.com/photo-1582142306909-195724d33ffc?w=800' },
    { name: 'Đầm Sơ Mi Cột Nơ Eo Thanh Lịch', price: 380000, op: 490000, b: 'Routine Minimal', img: 'https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?w=800' },
    { name: 'Đầm Dạ Hội Maxi Xẻ Đùi Quyến Rũ', price: 650000, op: 850000, b: 'Zara Woman', img: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800' },
    { name: 'Chân Váy Bút Chì Len Tăm Co Giãn', price: 260000, op: 320000, b: 'Routine Minimal', img: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800' },
    { name: 'Đầm Yếm Xòe Caro Dễ Thương Hàn Quốc', price: 310000, op: 390000, b: 'CLOSET Studio', img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800' },
  ],
  'Áo khoác': [
    { name: 'Áo Khoác Bomber Lót Bông Chống Gió', price: 680000, op: 850000, b: 'Zara Man', img: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=800' },
    { name: 'Áo Blazer Hàn Quốc 2 Lớp Form Rộng', price: 799000, op: 999000, b: 'Routine Minimal', img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800' },
    { name: 'Áo Khoác Gió Thể Thao Siêu Nhẹ Gấp Gọn', price: 320000, op: 420000, b: 'Uniqlo Style', img: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800' },
    { name: 'Áo Khoác Denim Bò Cổ Lông Cừu Dày Dặn', price: 650000, op: 820000, b: 'Levi Classic', img: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800' },
    { name: 'Áo Khoác Kaki Dáng Safari Nhiều Túi', price: 540000, op: 690000, b: 'Routine Minimal', img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800' },
    { name: 'Áo Cardigan Len Dệt Kim Họa Tiết Quả Trám', price: 390000, op: 490000, b: 'CLOSET Studio', img: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800' },
    { name: 'Áo Khoác Da Biker Khóa Kéo Lệch', price: 890000, op: 1190000, b: 'Zara Man', img: 'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=800' },
    { name: 'Áo Khoác Phao Dáng Ngắn Chống Nước Siêu Ấm', price: 720000, op: 950000, b: 'Uniqlo Style', img: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800' },
    { name: 'Áo Khoác Chống Nắng UV Protection Thoáng Mát', price: 290000, op: 370000, b: 'Uniqlo Style', img: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=800' },
    { name: 'Áo Măng Tô Dạ Dáng Dài Cao Cấp', price: 1250000, op: 1650000, b: 'Zara Man', img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800' },
  ],
  'Phụ kiện': [
    { name: 'Thắt Lưng Da Bò Khóa Kim Mạ Crom', price: 249000, op: 320000, b: 'CLOSET Studio', img: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800' },
    { name: 'Mũ Lưỡi Trai Classic Vải Kaki Thêu Nổi', price: 139000, op: 180000, b: 'CLOSET Studio', img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800' },
    { name: 'Kính Mát Unisex Tròng Phân Cực UV400', price: 299000, op: 399000, b: 'Routine Minimal', img: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800' },
    { name: 'Ví Da Nam Dáng Ngang Nhiều Ngăn Đựng Thẻ', price: 310000, op: 420000, b: 'CLOSET Studio', img: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800' },
    { name: 'Khăn Choàng Len Cashmere Cao Cấp', price: 280000, op: 380000, b: 'Routine Minimal', img: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800' },
    { name: 'Túi Đeo Chéo Canvas Mini Chống Nước', price: 189000, op: 250000, b: 'CLOSET Studio', img: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800' },
    { name: 'Mũ Beanie Len Dệt Kim Mùa Đông', price: 99000, op: 140000, b: 'Uniqlo Style', img: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800' },
    { name: 'Balo Laptop Chống Sốc Chống Nước 15.6 inch', price: 450000, op: 590000, b: 'CLOSET Studio', img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800' },
    { name: 'Đồng Hồ Nam Dây Da Tối Giản Kim Loại', price: 650000, op: 890000, b: 'Routine Minimal', img: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800' },
    { name: 'Cà Vạt Lụa Bản Nhỏ Họa Tiết Chìm', price: 120000, op: 170000, b: 'Zara Man', img: 'https://images.unsplash.com/photo-1589756823695-278bc923f962?w=800' },
  ],
  'Giày dép': [
    { name: 'Giày Sneaker Trắng Cổ Thấp Da Cao Cấp', price: 490000, op: 650000, b: 'Adidas Neo', img: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800' },
    { name: 'Giày Tây Oxford Nam Da Bò Đen Bóng', price: 750000, op: 950000, b: 'CLOSET Studio', img: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=800' },
    { name: 'Giày Chạy Bộ Thể Thao Lưới Thoáng Air', price: 580000, op: 790000, b: 'Nike Sportswear', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800' },
    { name: 'Dép Quai Hậu Sandal Nam Nữ Dây Dù', price: 220000, op: 290000, b: 'CLOSET Studio', img: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=800' },
    { name: 'Giày Lười Loafer Da Lộn Màu Nâu', price: 620000, op: 790000, b: 'Zara Man', img: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800' },
    { name: 'Giày Boots Cổ Cao Da Sáp Phong Cách Bụi', price: 850000, op: 1100000, b: 'CLOSET Studio', img: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800' },
    { name: 'Dép Slide Quai Ngang Đúc Nguyên Khối', price: 150000, op: 200000, b: 'Adidas Neo', img: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800' },
    { name: 'Giày Cao Gót Mũi Nhọn 7 Phân Sang Chảnh', price: 420000, op: 550000, b: 'Zara Woman', img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800' },
    { name: 'Giày Búp Bê Nơ Da Mềm Đi Êm Chân', price: 280000, op: 360000, b: 'Routine Minimal', img: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800' },
    { name: 'Giày Lười Slip-on Vải Canvas Tiện Lợi', price: 310000, op: 400000, b: 'CLOSET Studio', img: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800' },
  ],
  'Khác': [
    { name: 'Set 5 Đôi Vớ Cổ Ngắn Cotton Kháng Khuẩn', price: 99000, op: 150000, b: 'Uniqlo Style', img: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=800' },
    { name: 'Bình Nước Giữ Nhiệt Inox 304 500ml', price: 180000, op: 250000, b: 'CLOSET Studio', img: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800' },
    { name: 'Xịt Khử Mùi Quần Áo Và Giày Hương Hoa 100ml', price: 85000, op: 120000, b: 'Routine Minimal', img: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800' },
    { name: 'Cây Lăn Bụi Quần Áo Đa Năng 60 Tờ', price: 49000, op: 70000, b: 'CLOSET Studio', img: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800' },
    { name: 'Túi Giặt Quần Áo Lưới Dày Bảo Vệ Đồ Giặt Máy', price: 35000, op: 50000, b: 'CLOSET Studio', img: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800' },
    { name: 'Móc Gỗ Treo Quần Áo Bộ 10 Chiếc Chống Trượt', price: 120000, op: 160000, b: 'Routine Minimal', img: 'https://images.unsplash.com/photo-1584679109597-c656b19974c9?w=800' },
    { name: 'Bàn Là Hơi Nước Cầm Tay Du Lịch Nhỏ Gọn', price: 350000, op: 480000, b: 'Uniqlo Style', img: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=800' },
    { name: 'Gối Cổ Chữ U Cao Su Non Du Lịch', price: 160000, op: 220000, b: 'CLOSET Studio', img: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800' },
    { name: 'Bộ Chiết Mỹ Phẩm Du Lịch 6 Món Tiện Lợi', price: 79000, op: 110000, b: 'Routine Minimal', img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800' },
    { name: 'Ô Dù Gấp Gọn Che Mưa Nắng Tự Động 2 Chiều', price: 145000, op: 195000, b: 'Uniqlo Style', img: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800' },
  ],
};

const allProducts = [];
categories.forEach((cat) => {
  const items = dataByCat[cat] || [];
  items.forEach((item, index) => {
    allProducts.push({
      name: item.name,
      description: `${item.name} - Chất lượng cao, gia công tinh xảo, phong cách thời trang hiện đại phù hợp mọi lứa tuổi.`,
      price: item.price,
      originalPrice: item.op,
      category: cat,
      brand: item.b,
      stock: 20 + ((index * 13) % 80),
      images: [item.img],
      rating: +(4.4 + (index % 6) * 0.1).toFixed(1),
      numReviews: 15 + index * 8,
      isActive: true,
    });
  });
});

async function run() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shop-project';
  console.log('🔄 Đang kết nối tới MongoDB:', mongoUri);
  await mongoose.connect(mongoUri);

  await Product.deleteMany({});
  console.log('🧹 Đã xóa toàn bộ sản phẩm cũ.');

  const inserted = await Product.insertMany(allProducts);
  console.log(`✅ ĐÃ THÊM THÀNH CÔNG ${inserted.length} SẢN PHẨM (MỖI DANH MỤC 10 SẢN PHẨM)!`);

  const summary = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
    { $sort: { count: -1 } },
  ]);

  console.table(
    summary.map((s) => ({
      'Danh mục': s._id,
      'Số lượng': s.count,
      'Giá TB (VND)': Math.round(s.avgPrice).toLocaleString('vi-VN'),
    }))
  );

  await mongoose.connection.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

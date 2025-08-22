'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Home,
  Code,
  BookOpen,
  Video,
  User,
  Bell,
  Calendar,
  Star,
  CheckCircle,
  Flame,
  TrendingUp,
  Target,
  Award,
  MessageSquare,
  FileText,
  Plus,
  ArrowRight,
  ArrowLeft,
  Edit,
  LogOut,
  Search,
  MoreHorizontal,
  CreditCard,
  Clock,
  X,
  Save
} from 'lucide-react';
import Header from './Header';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { activityService, ActivityItem } from '@/services/activityService';

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

const StudentDashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [notifications, setNotifications] = useState(3);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  const userProfile = {
    name: user?.name || 'Guest User',
    email: user?.email || 'guest@example.com',
    level: 'Intermediate',
    points: 2850,
    streak: 15,
    joinedDate: 'January 2024',
    completedQuizzes: 45,
    totalStudyTime: 127,
    achievements: 12,
    ranking: 8
  };

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setLoading(true);
        const response = await activityService.getRecentActivity(5);
        if (response.success) {
          setRecentActivity(response.data);
        }
      } catch (error) {
        console.error('Error fetching recent activity:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivity();
  }, []);

  const sidebarItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      color: 'text-blue-500',
      count: null
    },
    {
      id: 'coding',
      label: 'Coding',
      icon: Code,
      color: 'text-purple-500',
      count: 28
    },
    {
      id: 'practice',
      label: 'Practice',
      icon: BookOpen,
      color: 'text-green-500',
      count: 45
    },
    {
      id: 'interview',
      label: 'Interview',
      icon: Video,
      color: 'text-red-500',
      count: 12
    },
    {
      id: 'subscription',
      label: 'Subscription',
      icon: CreditCard,
      color: 'text-orange-500',
      count: null
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      color: 'text-indigo-500',
      count: null
    }
  ];

  const quickStats = [
    {
      title: 'Interviews Given',
      value: '12',
      change: '+2',
      changeType: 'positive',
      icon: Video,
      color: 'bg-red-500'
    },
    {
      title: 'Quizzes Completed',
      value: userProfile.completedQuizzes.toString(),
      change: '+5',
      changeType: 'positive',
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      title: 'Coding Questions',
      value: '28',
      change: '+3',
      changeType: 'positive',
      icon: Code,
      color: 'bg-purple-500'
    }
  ];



  const upcomingTasks = [
    {
      id: 1,
      title: 'Complete React Quiz',
      dueDate: 'Today, 6:00 PM',
      priority: 'high',
      type: 'quiz'
    },
    {
      id: 2,
      title: 'Practice Dynamic Programming',
      dueDate: 'Tomorrow, 2:00 PM',
      priority: 'medium',
      type: 'coding'
    },
    {
      id: 3,
      title: 'Mock Interview with Sarah',
      dueDate: 'Friday, 10:00 AM',
      priority: 'high',
      type: 'interview'
    }
  ];

  const achievements = [
    {
      id: 1,
      title: 'Quiz Master',
      description: 'Complete 50 quizzes',
      progress: 90,
      total: 50,
      current: 45,
      icon: BookOpen,
      color: 'bg-green-500',
      unlocked: false
    },
    {
      id: 2,
      title: 'Code Warrior',
      description: 'Solve 100 coding problems',
      progress: 65,
      total: 100,
      current: 65,
      icon: Code,
      color: 'bg-purple-500',
      unlocked: false
    },
    {
      id: 3,
      title: 'Interview Pro',
      description: 'Complete 20 mock interviews',
      progress: 100,
      total: 20,
      current: 20,
      icon: Video,
      color: 'bg-blue-500',
      unlocked: true
    }
  ];

  const studyPlan = {
    currentWeek: 3,
    totalWeeks: 12,
    weeklyGoals: [
      { day: 'Mon', completed: true, type: 'quiz' },
      { day: 'Tue', completed: true, type: 'coding' },
      { day: 'Wed', completed: false, type: 'interview', current: true },
      { day: 'Thu', completed: false, type: 'quiz' },
      { day: 'Fri', completed: false, type: 'coding' },
      { day: 'Sat', completed: false, type: 'review' },
      { day: 'Sun', completed: false, type: 'rest' }
    ]
  };

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    if (onNavigate) {
      onNavigate(sectionId);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen': return BookOpen;
      case 'Code': return Code;
      case 'Video': return Video;
      case 'CheckCircle': return CheckCircle;
      case 'Star': return Star;
      case 'Flame': return Flame;
      case 'Award': return Award;
      default: return BookOpen;
    }
  };

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    college: '',
    degree: '',
    yearOfCompletion: '',
    branch: '',
    cgpa: 0,
    location: '',
    bio: '',
    skills: [] as string[]
  });

  const degreeOptions = ['Bachelor of Technology (B.Tech)', 'Master of Technology (M.Tech)', 'Bachelor of Science (B.Sc)', 'Master of Science (M.Sc)', 'Bachelor of Arts (B.A)', 'Master of Arts (M.A)', 'Bachelor of Commerce (B.Com)', 'Master of Commerce (M.Com)', 'Bachelor of Law (LLB)', 'Master of Law (LLM)', 'Bachelor of Education (B.Ed)', 'Master of Education (M.Ed)', 'Bachelor of Fine Arts (B.F.A)', 'Master of Fine Arts (M.F.A)', 'Bachelor of Pharmacy (B.Pharm)', 'Master of Pharmacy (M.Pharm)', 'Bachelor of Nursing (B.Sc Nursing)', 'Master of Nursing (M.Sc Nursing)', 'Bachelor of Architecture (B.Arch)', 'Master of Architecture (M.Arch)', 'Bachelor of Planning (B.Plan)', 'Master of Planning (M.Plan)', 'Bachelor of Management Studies (BMS)', 'Master of Management Studies (MMS)', 'Bachelor of Computer Applications (BCA)', 'Master of Computer Applications (MCA)', 'Bachelor of Business Administration (BBA)', 'Master of Business Administration (MBA)', 'Bachelor of Hotel Management (BHM)', 'Master of Hotel Management (MHM)', 'Bachelor of Tourism Management (BTM)', 'Master of Tourism Management (MTM)', 'Bachelor of Journalism and Mass Communication (BJMC)', 'Master of Journalism and Mass Communication (MJMC)', 'Bachelor of Library and Information Science (BLIS)', 'Master of Library and Information Science (MLIS)', 'Bachelor of Social Work (B.SW)', 'Master of Social Work (M.SW)', 'Bachelor of Commerce (Hons.)', 'Master of Commerce (Hons.)', 'Bachelor of Science (Hons.)', 'Master of Science (Hons.)', 'Bachelor of Arts (Hons.)', 'Master of Arts (Hons.)', 'Bachelor of Fine Arts (Hons.)', 'Master of Fine Arts (Hons.)', 'Bachelor of Pharmacy (Hons.)', 'Master of Pharmacy (Hons.)', 'Bachelor of Nursing (Hons.)', 'Master of Nursing (Hons.)', 'Bachelor of Architecture (Hons.)', 'Master of Architecture (Hons.)', 'Bachelor of Planning (Hons.)', 'Master of Planning (Hons.)', 'Bachelor of Management Studies (Hons.)', 'Master of Management Studies (Hons.)', 'Bachelor of Computer Applications (Hons.)', 'Master of Computer Applications (Hons.)', 'Bachelor of Business Administration (Hons.)', 'Master of Business Administration (Hons.)', 'Bachelor of Hotel Management (Hons.)', 'Master of Hotel Management (Hons.)', 'Bachelor of Tourism Management (Hons.)', 'Master of Tourism Management (Hons.)', 'Bachelor of Journalism and Mass Communication (Hons.)', 'Master of Journalism and Mass Communication (Hons.)', 'Bachelor of Library and Information Science (Hons.)', 'Master of Library and Information Science (Hons.)', 'Bachelor of Social Work (Hons.)', 'Master of Social Work (Hons.)'];
  const yearOptions = ['2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013', '2012', '2011', '2010', '2009', '2008', '2007', '2006', '2005', '2004', '2003', '2002', '2001', '2000', '1999', '1998', '1997', '1996', '1995', '1994', '1993', '1992', '1991', '1990', '1989', '1988', '1987', '1986', '1985', '1984', '1983', '1982', '1981', '1980', '1979', '1978', '1977', '1976', '1975', '1974', '1973', '1972', '1971', '1970', '1969', '1968', '1967', '1966', '1965', '1964', '1963', '1962', '1961', '1960', '1959', '1958', '1957', '1956', '1955', '1954', '1953', '1952', '1951', '1950', '1949', '1948', '1947', '1946', '1945', '1944', '1943', '1942', '1941', '1940', '1939', '1938', '1937', '1936', '1935', '1934', '1933', '1932', '1931', '1930', '1929', '1928', '1927', '1926', '1925', '1924', '1923', '1922', '1921', '1920', '1919', '1918', '1917', '1916', '1915', '1914', '1913', '1912', '1911', '1910', '1909', '1908', '1907', '1906', '1905', '1904', '1903', '1902', '1901', '1900', '1899', '1898', '1897', '1896', '1895', '1894', '1893', '1892', '1891', '1890', '1889', '1888', '1887', '1886', '1885', '1884', '1883', '1882', '1881', '1880', '1879', '1878', '1877', '1876', '1875', '1874', '1873', '1872', '1871', '1870', '1869', '1868', '1867', '1866', '1865', '1864', '1863', '1862', '1861', '1860', '1859', '1858', '1857', '1856', '1855', '1854', '1853', '1852', '1851', '1850', '1849', '1848', '1847', '1846', '1845', '1844', '1843', '1842', '1841', '1840', '1839', '1838', '1837', '1836', '1835', '1834', '1833', '1832', '1831', '1830', '1829', '1828', '1827', '1826', '1825', '1824', '1823', '1822', '1821', '1820', '1819', '1818', '1817', '1816', '1815', '1814', '1813', '1812', '1811', '1810', '1809', '1808', '1807', '1806', '1805', '1804', '1803', '1802', '1801', '1800', '1799', '1798', '1797', '1796', '1795', '1794', '1793', '1792', '1791', '1790', '1789', '1788', '1787', '1786', '1785', '1784', '1783', '1782', '1781', '1780', '1779', '1778', '1777', '1776', '1775', '1774', '1773', '1772', '1771', '1770', '1769', '1768', '1767', '1766', '1765', '1764', '1763', '1762', '1761', '1760', '1759', '1758', '1757', '1756', '1755', '1754', '1753', '1752', '1751', '1750', '1749', '1748', '1747', '1746', '1745', '1744', '1743', '1742', '1741', '1740', '1739', '1738', '1737', '1736', '1735', '1734', '1733', '1732', '1731', '1730', '1729', '1728', '1727', '1726', '1725', '1724', '1723', '1722', '1721', '1720', '1719', '1718', '1717', '1716', '1715', '1714', '1713', '1712', '1711', '1710', '1709', '1708', '1707', '1706', '1705', '1704', '1703', '1702', '1701', '1700', '1699', '1698', '1697', '1696', '1695', '1694', '1693', '1692', '1691', '1690', '1689', '1688', '1687', '1686', '1685', '1684', '1683', '1682', '1681', '1680', '1679', '1678', '1677', '1676', '1675', '1674', '1673', '1672', '1671', '1670', '1669', '1668', '1667', '1666', '1665', '1664', '1663', '1662', '1661', '1660', '1659', '1658', '1657', '1656', '1655', '1654', '1653', '1652', '1651', '1650', '1649', '1648', '1647', '1646', '1645', '1644', '1643', '1642', '1641', '1640', '1639', '1638', '1637', '1636', '1635', '1634', '1633', '1632', '1631', '1630', '1629', '1628', '1627', '1626', '1625', '1624', '1623', '1622', '1621', '1620', '1619', '1618', '1617', '1616', '1615', '1614', '1613', '1612', '1611', '1610', '1609', '1608', '1607', '1606', '1605', '1604', '1603', '1602', '1601', '1600', '1599', '1598', '1597', '1596', '1595', '1594', '1593', '1592', '1591', '1590', '1589', '1588', '1587', '1586', '1585', '1584', '1583', '1582', '1581', '1580', '1579', '1578', '1577', '1576', '1575', '1574', '1573', '1572', '1571', '1570', '1569', '1568', '1567', '1566', '1565', '1564', '1563', '1562', '1561', '1560', '1559', '1558', '1557', '1556', '1555', '1554', '1553', '1552', '1551', '1550', '1549', '1548', '1547', '1546', '1545', '1544', '1543', '1542', '1541', '1540', '1539', '1538', '1537', '1536', '1535', '1534', '1533', '1532', '1531', '1530', '1529', '1528', '1527', '1526', '1525', '1524', '1523', '1522', '1521', '1520', '1519', '1518', '1517', '1516', '1515', '1514', '1513', '1512', '1511', '1510', '1509', '1508', '1507', '1506', '1505', '1504', '1503', '1502', '1501', '1500', '1499', '1498', '1497', '1496', '1495', '1494', '1493', '1492', '1491', '1490', '1489', '1488', '1487', '1486', '1485', '1484', '1483', '1482', '1481', '1480', '1479', '1478', '1477', '1476', '1475', '1474', '1473', '1472', '1471', '1470', '1469', '1468', '1467', '1466', '1465', '1464', '1463', '1462', '1461', '1460', '1459', '1458', '1457', '1456', '1455', '1454', '1453', '1452', '1451', '1450', '1449', '1448', '1447', '1446', '1445', '1444', '1443', '1442', '1441', '1440', '1439', '1438', '1437', '1436', '1435', '1434', '1433', '1432', '1431', '1430', '1429', '1428', '1427', '1426', '1425', '1424', '1423', '1422', '1421', '1420', '1419', '1418', '1417', '1416', '1415', '1414', '1413', '1412', '1411', '1410', '1409', '1408', '1407', '1406', '1405', '1404', '1403', '1402', '1401', '1400', '1399', '1398', '1397', '1396', '1395', '1394', '1393', '1392', '1391', '1390', '1389', '1388', '1387', '1386', '1385', '1384', '1383', '1382', '1381', '1380', '1379', '1378', '1377', '1376', '1375', '1374', '1373', '1372', '1371', '1370', '1369', '1368', '1367', '1366', '1365', '1364', '1363', '1362', '1361', '1360', '1359', '1358', '1357', '1356', '1355', '1354', '1353', '1352', '1351', '1350', '1349', '1348', '1347', '1346', '1345', '1344', '1343', '1342', '1341', '1340', '1339', '1338', '1337', '1336', '1335', '1334', '1333', '1332', '1331', '1330', '1329', '1328', '1327', '1326', '1325', '1324', '1323', '1322', '1321', '1320', '1319', '1318', '1317', '1316', '1315', '1314', '1313', '1312', '1311', '1310', '1309', '1308', '1307', '1306', '1305', '1304', '1303', '1302', '1301', '1300', '1299', '1298', '1297', '1296', '1295', '1294', '1293', '1292', '1291', '1290', '1289', '1288', '1287', '1286', '1285', '1284', '1283', '1282', '1281', '1280', '1279', '1278', '1277', '1276', '1275', '1274', '1273', '1272', '1271', '1270', '1269', '1268', '1267', '1266', '1265', '1264', '1263', '1262', '1261', '1260', '1259', '1258', '1257', '1256', '1255', '1254', '1253', '1252', '1251', '1250', '1249', '1248', '1247', '1246', '1245', '1244', '1243', '1242', '1241', '1240', '1239', '1238', '1237', '1236', '1235', '1234', '1233', '1232', '1231', '1230', '1229', '1228', '1227', '1226', '1225', '1224', '1223', '1222', '1221', '1220', '1219', '1218', '1217', '1216', '1215', '1214', '1213', '1212', '1211', '1210', '1209', '1208', '1207', '1206', '1205', '1204', '1203', '1202', '1201', '1200', '1199', '1198', '1197', '1196', '1195', '1194', '1193', '1192', '1191', '1190', '1189', '1188', '1187', '1186', '1185', '1184', '1183', '1182', '1181', '1180', '1179', '1178', '1177', '1176', '1175', '1174', '1173', '1172', '1171', '1170', '1169', '1168', '1167', '1166', '1165', '1164', '1163', '1162', '1161', '1160', '1159', '1158', '1157', '1156', '1155', '1154', '1153', '1152', '1151', '1150', '1149', '1148', '1147', '1146', '1145', '1144', '1143', '1142', '1141', '1140', '1139', '1138', '1137', '1136', '1135', '1134', '1133', '1132', '1131', '1130', '1129', '1128', '1127', '1126', '1125', '1124', '1123', '1122', '1121', '1120', '1119', '1118', '1117', '1116', '1115', '1114', '1113', '1112', '1111', '1110', '1109', '1108', '1107', '1106', '1105', '1104', '1103', '1102', '1101', '1100', '1099', '1098', '1097', '1096', '1095', '1094', '1093', '1092', '1091', '1090', '1089', '1088', '1087', '1086', '1085', '1084', '1083', '1082', '1081', '1080', '1079', '1078', '1077', '1076', '1075', '1074', '1073', '1072', '1071', '1070', '1069', '1068', '1067', '1066', '1065', '1064', '1063', '1062', '1061', '1060', '1059', '1058', '1057', '1056', '1055', '1054', '1053', '1052', '1051', '1050', '1049', '1048', '1047', '1046', '1045', '1044', '1043', '1042', '1041', '1040', '1039', '1038', '1037', '1036', '1035', '1034', '1033', '1032', '1031', '1030', '1029', '1028', '1027', '1026', '1025', '1024', '1023', '1022', '1021', '1020', '1019', '1018', '1017', '1016', '1015', '1014', '1013', '1012', '1011', '1010', '1009', '1008', '1007', '1006', '1005', '1004', '1003', '1002', '1001', '1000', '999', '998', '997', '996', '995', '994', '993', '992', '991', '990', '989', '988', '987', '986', '985', '984', '983', '982', '981', '980', '979', '978', '977', '976', '975', '974', '973', '972', '971', '970', '969', '968', '967', '966', '965', '964', '963', '962', '961', '960', '959', '958', '957', '956', '955', '954', '953', '952', '951', '950', '949', '948', '947', '946', '945', '944', '943', '942', '941', '940', '939', '938', '937', '936', '935', '934', '933', '932', '931', '930', '929', '928', '927', '926', '925', '924', '923', '922', '921', '920', '919', '918', '917', '916', '915', '914', '913', '912', '911', '910', '909', '908', '907', '906', '905', '904', '903', '902', '901', '900', '899', '898', '897', '896', '895', '894', '893', '892', '891', '890', '889', '888', '887', '886', '885', '884', '883', '882', '881', '880', '879', '878', '877', '876', '875', '874', '873', '872', '871', '870', '869', '868', '867', '866', '865', '864', '863', '862', '861', '860', '859', '858', '857', '856', '855', '854', '853', '852', '851', '850', '849', '848', '847', '846', '845', '844', '843', '842', '841', '840', '839', '838', '837', '836', '835', '834', '833', '832', '831', '830', '829', '828', '827', '826', '825', '824', '823', '822', '821', '820', '819', '818', '817', '816', '815', '814', '813', '812', '811', '810', '809', '808', '807', '806', '805', '804', '803', '802', '801', '800', '799', '798', '797', '796', '795', '794', '793', '792', '791', '790', '789', '788', '787', '786', '785', '784', '783', '782', '781', '780', '779', '778', '777', '776', '775', '774', '773', '772', '771', '770', '769', '768', '767', '766', '765', '764', '763', '762', '761', '760', '759', '758', '757', '756', '755', '754', '753', '752', '751', '750', '749', '748', '747', '746', '745', '744', '743', '742', '741', '740', '739', '738', '737', '736', '735', '734', '733', '732', '731', '730', '729', '728', '727', '726', '725', '724', '723', '722', '721', '720', '719', '718', '717', '716', '715', '714', '713', '712', '711', '710', '709', '708', '707', '706', '705', '704', '703', '702', '701', '700', '699', '698', '697', '696', '695', '694', '693', '692', '691', '690', '689', '688', '687', '686', '685', '684', '683', '682', '681', '680', '679', '678', '677', '676', '675', '674', '673', '672', '671', '670', '669', '668', '667', '666', '665', '664', '663', '662', '661', '660', '659', '658', '657', '656', '655', '654', '653', '652', '651', '650', '649', '648', '647', '646', '645', '644', '643', '642', '641', '640', '639', '638', '637', '636', '635', '634', '633', '632', '631', '630', '629', '628', '627', '626', '625', '624', '623', '622', '621', '620', '619', '618', '617', '616', '615', '614', '613', '612', '611', '610', '609', '608', '607', '606', '605', '604', '603', '602', '601', '600', '599', '598', '597', '596', '595', '594', '593', '592', '591', '590', '589', '588', '587', '586', '585', '584', '583', '582', '581', '580', '579', '578', '577', '576', '575', '574', '573', '572', '571', '570', '569', '568', '567', '566', '565', '564', '563', '562', '561', '560', '559', '558', '557', '556', '555', '554', '553', '552', '551', '550', '549', '548', '547', '546', '545', '544', '543', '542', '541', '540', '539', '538', '537', '536', '535', '534', '533', '532', '531', '530', '529', '528', '527', '526', '525', '524', '523', '522', '521', '520', '519', '518', '517', '516', '515', '514', '513', '512', '511', '510', '509', '508', '507', '506', '505', '504', '503', '502', '501', '500', '499', '498', '497', '496', '495', '494', '493', '492', '491', '490', '489', '488', '487', '486', '485', '484', '483', '482', '481', '480', '479', '478', '477', '476', '475', '474', '473', '472', '471', '470', '469', '468', '467', '466', '465', '464', '463', '462', '461', '460', '459', '458', '457', '456', '455', '454', '453', '452', '451', '450', '449', '448', '447', '446', '445', '444', '443', '442', '441', '440', '439', '438', '437', '436', '435', '434', '433', '432', '431', '430', '429', '428', '427', '426', '425', '424', '423', '422', '421', '420', '419', '418', '417', '416', '415', '414', '413', '412', '411', '410', '409', '408', '407', '406', '405', '404', '403', '402', '401', '400', '399', '398', '397', '396', '395', '394', '393', '392', '391', '390', '389', '388', '387', '386', '385', '384', '383', '382', '381', '380', '379', '378', '377', '376', '375', '374', '373', '372', '371', '370', '369', '368', '367', '366', '365', '364', '363', '362', '361', '360', '359', '358', '357', '356', '355', '354', '353', '352', '351', '350', '349', '348', '347', '346', '345', '344', '343', '342', '341', '340', '339', '338', '337', '336', '335', '334', '333', '332', '331', '330', '329', '328', '327', '326', '325', '324', '323', '322', '321', '320', '319', '318', '317', '316', '315', '314', '313', '312', '311', '310', '309', '308', '307', '306', '305', '304', '303', '302', '301', '300', '299', '298', '297', '296', '295', '294', '293', '292', '291', '290', '289', '288', '287', '286', '285', '284', '283', '282', '281', '280', '279', '278', '277', '276', '275', '274', '273', '272', '271', '270', '269', '268', '267', '266', '265', '264', '263', '262', '261', '260', '259', '258', '257', '256', '255', '254', '253', '252', '251', '250', '249', '248', '247', '246', '245', '244', '243', '242', '241', '240', '239', '238', '237', '236', '235', '234', '233', '232', '231', '230', '229', '228', '227', '226', '225', '224', '223', '222', '221', '220', '219', '218', '217', '216', '215', '214', '213', '212', '211', '210', '209', '208', '207', '206', '205', '204', '203', '202', '201', '200', '199', '198', '197', '196', '195', '194', '193', '192', '191', '190', '189', '188', '187', '186', '185', '184', '183', '182', '181', '180', '179', '178', '177', '176', '175', '174', '173', '172', '171', '170', '169', '168', '167', '166', '165', '164', '163', '162', '161', '160', '159', '158', '157', '156', '155', '154', '153', '152', '151', '150', '149', '148', '147', '146', '145', '144', '143', '142', '141', '140', '139', '138', '137', '136', '135', '134', '133', '132', '131', '130', '129', '128', '127', '126', '125', '124', '123', '122', '121', '120', '119', '118', '117', '116', '115', '114', '113', '112', '111', '110', '109', '108', '107', '106', '105', '104', '103', '102', '101', '100', '99', '98', '97', '96', '95', '94', '93', '92', '91', '90', '89', '88', '87', '86', '85', '84', '83', '82', '81', '80', '79', '78', '77', '76', '75', '74', '73', '72', '71', '70', '69', '68', '67', '66', '65', '64', '63', '62', '61', '60', '59', '58', '57', '56', '55', '54', '53', '52', '51', '50', '49', '48', '47', '46', '45', '44', '43', '42', '41', '40', '39', '38', '37', '36', '35', '34', '33', '32', '31', '30', '29', '28', '27', '26', '25', '24', '23', '22', '21', '20', '19', '18', '17', '16', '15', '14', '13', '12', '11', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', '0'];

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      college: '',
      degree: '',
      yearOfCompletion: '',
      branch: '',
      cgpa: 0,
      location: '',
      bio: '',
      skills: [] as string[]
    });
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      college: '',
      degree: '',
      yearOfCompletion: '',
      branch: '',
      cgpa: 0,
      location: '',
      bio: '',
      skills: [] as string[]
    });
  };

  const handleSaveProfile = () => {
    // In a real application, you would send this data to an API
    console.log('Saving profile:', profileData);
    setIsEditingProfile(false);
  };

  const handleProfileChange = (field: string, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex h-screen">
      {/* Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col`}>
        {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center">
                  <Image
                    src="/aslogo.svg"
                    alt="Ascend Skills"
                    width={40}
                    height={40}
                    className="h-10 w-auto"
                  />
                <div className="ml-3">
                    <h2 className="text-lg font-bold text-gray-900">Ascend Skills</h2>
                    <p className="text-sm text-gray-600">Student Dashboard</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
                {sidebarCollapsed ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* User Profile Section */}
        {!sidebarCollapsed && (
            <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">{userProfile.name}</h3>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {showProfileMenu && (
                    <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <button className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </button>
                      <hr className="my-2 border-gray-200" />
                      <button 
                        onClick={() => logout('/')}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center text-red-600"
                      >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Quick Stats in Sidebar */}
              
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
                    className={`w-full flex items-center px-3 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-primary text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'} ${isActive ? 'text-white' : item.color}`} />
                    {!sidebarCollapsed && (
                      <>
                        <span className="font-medium flex-1 text-left">{item.label}</span>
                        {item.count && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {item.count}
                          </span>
                        )}
                      </>
                    )}
                  </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                {activeSection === 'dashboard' ? 'Dashboard' : 
                 sidebarItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
              </h1>
                <p className="text-gray-600">
                Hello, {userProfile.name}! Ready to learn with Ascend Skills?
              </p>
              </div>
              

          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-6">
                {quickStats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <span className={`text-sm font-medium ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.change}
                        </span>
                      </div>
                        <h3 className="text-gray-600 text-sm font-medium">{stat.title}</h3>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </motion.div>
                  );
                })}
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Study Plan Progress */}
                  <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Weekly Study Plan</h3>
                      <span className="text-sm text-gray-600">Week {studyPlan.currentWeek} of {studyPlan.totalWeeks}</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{Math.round((studyPlan.currentWeek / studyPlan.totalWeeks) * 100)}%</span>
                    </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(studyPlan.currentWeek / studyPlan.totalWeeks) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2 mt-6">
                    {studyPlan.weeklyGoals.map((goal, index) => (
                      <div key={index} className="text-center">
                          <div className="text-xs text-gray-600 mb-2">{goal.day}</div>
                        <div 
                          className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto ${
                            goal.completed 
                              ? 'bg-green-500 text-white' 
                              : goal.current
                              ? 'bg-primary-500 text-white animate-pulse'
                                : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {goal.completed ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : goal.current ? (
                            <Clock className="w-5 h-5" />
                          ) : (
                            <div className="w-2 h-2 bg-current rounded-full" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Tasks */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Upcoming Tasks</h3>
                    <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                      View All
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {upcomingTasks.map((task) => (
                      <div key={task.id} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          task.priority === 'high' ? 'bg-red-500' : 
                          task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                            <p className="text-xs text-gray-600">{task.dueDate}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                    <button className="w-full mt-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center justify-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </button>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
                    
                    {loading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center space-x-4 animate-pulse">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                  <div className="space-y-4">
                        {recentActivity.length > 0 ? (
                          recentActivity.map((activity) => {
                            const IconComponent = getIconComponent(activity.icon);
                      return (
                        <div key={activity.id} className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activity.color}`}>
                                  <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{activity.title}</h4>
                                  <p className="text-sm text-gray-600">{activity.description} - {activity.time}</p>
                          </div>
                        </div>
                      );
                          })
                        ) : (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <BookOpen className="w-8 h-8 text-gray-400" />
                            </div>
                            <h4 className="text-lg font-medium text-gray-900 mb-2">Not attempted</h4>
                            <p className="text-gray-500 mb-6">Start your learning journey by attempting your first quiz or coding problem!</p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                              <button 
                                onClick={() => window.location.href = '/quiz'}
                                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                              >
                                Attempt Quiz
                              </button>
                              <button 
                                onClick={() => window.location.href = '/coding'}
                                className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
                              >
                                Attempt Coding
                              </button>
                            </div>
                          </div>
                        )}
                  </div>
                    )}
                </div>

                {/* Achievements Progress */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Achievement Progress</h3>
                  
                  <div className="space-y-6">
                    {achievements.map((achievement) => {
                      const Icon = achievement.icon;
                      return (
                        <div key={achievement.id}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${achievement.color} ${achievement.unlocked ? '' : 'opacity-50'}`}>
                                <Icon className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                  <h4 className={`font-medium ${achievement.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                                  {achievement.title}
                                </h4>
                                  <p className="text-xs text-gray-600">{achievement.description}</p>
                              </div>
                            </div>
                            {achievement.unlocked && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                          <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">{achievement.current}/{achievement.total}</span>
                            <span className="font-medium">{achievement.progress}%</span>
                          </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${achievement.unlocked ? 'bg-green-500' : 'bg-gray-400'}`}
                              style={{ width: `${achievement.progress}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other sections would be rendered here based on activeSection */}
          {activeSection !== 'dashboard' && activeSection !== 'profile' && (
            <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  {(() => {
                    const item = sidebarItems.find(item => item.id === activeSection);
                    if (item) {
                      const Icon = item.icon;
                      return <Icon className="w-8 h-8 text-gray-500" />;
                    }
                    return null;
                  })()}
              </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                {sidebarItems.find(item => item.id === activeSection)?.label}
              </h3>
                <p className="text-gray-600">
                This section is under development. Coming soon!
              </p>
            </div>
          )}

          {/* Profile Section */}
          {activeSection === 'profile' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Profile Information</h3>
                  {!isEditingProfile ? (
                    <button
                      onClick={handleEditProfile}
                      className="flex items-center px-4 py-2 bg-gradient-primary text-white rounded-lg hover:shadow-lg transition-all duration-300"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex space-x-3">
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => handleProfileChange('name', e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                        {profileData.name || 'Not provided'}
                      </div>
                    )}
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                        placeholder="Enter your email address"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                        {profileData.email || 'Not provided'}
                      </div>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                        placeholder="Enter your phone number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                        {profileData.phone || 'Not provided'}
                      </div>
                    )}
                  </div>

                  {/* College/University Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      College/University Name *
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={profileData.college}
                        onChange={(e) => handleProfileChange('college', e.target.value)}
                        placeholder="Enter your college/university name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                        {profileData.college || 'Not provided'}
                      </div>
                    )}
                  </div>

                  {/* Degree */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Degree *
                    </label>
                    {isEditingProfile ? (
                      <select
                        value={profileData.degree}
                        onChange={(e) => handleProfileChange('degree', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Degree</option>
                        {degreeOptions.map((degree) => (
                          <option key={degree} value={degree}>
                            {degree}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                        {profileData.degree || 'Not provided'}
                      </div>
                    )}
                  </div>

                  {/* Year of Completion */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year of Completion *
                    </label>
                    {isEditingProfile ? (
                      <select
                        value={profileData.yearOfCompletion}
                        onChange={(e) => handleProfileChange('yearOfCompletion', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Year</option>
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                        {profileData.yearOfCompletion || 'Not provided'}
                      </div>
                    )}
                  </div>

                  {/* Branch */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Branch
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={profileData.branch}
                        onChange={(e) => handleProfileChange('branch', e.target.value)}
                        placeholder="Enter your branch"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                        {profileData.branch || 'Not provided'}
                      </div>
                    )}
                  </div>

                  {/* CGPA */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CGPA
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={profileData.cgpa}
                        onChange={(e) => handleProfileChange('cgpa', parseFloat(e.target.value) || 0)}
                        placeholder="Enter your CGPA"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                        {profileData.cgpa > 0 ? profileData.cgpa.toFixed(2) : 'Not provided'}
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) => handleProfileChange('location', e.target.value)}
                        placeholder="Enter your location"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                        {profileData.location || 'Not provided'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Skills */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills
                  </label>
                  {isEditingProfile ? (
                    <div>
                      <input
                        type="text"
                        placeholder="Add a skill and press Enter"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.target as HTMLInputElement;
                            const skill = input.value.trim();
                            if (skill && !profileData.skills.includes(skill)) {
                              handleProfileChange('skills', [...profileData.skills, skill]);
                              input.value = '';
                            }
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
                      />
                      <div className="flex flex-wrap gap-2">
                        {profileData.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                          >
                            {skill}
                            <button
                              onClick={() => handleProfileChange('skills', profileData.skills.filter((_, i) => i !== index))}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                      {profileData.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profileData.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">No skills added</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bio */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  {isEditingProfile ? (
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => handleProfileChange('bio', e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {profileData.bio || 'No bio provided'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard; 
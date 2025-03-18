import { object, string } from "yup";

const contacts = [
  {
    id: "VPK-74083",
    image: "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342643/avatar-40-18_atswv7.jpg",
    name: "Marco Rossi",
    status: "Inactive",
    location: "Madrid, Spain",
    verified: false,
    referral: {
      name: "Hiroshi Yamamoto",
      image:
        "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342643/avatar-40-16_zn3ygb.jpg",
    },
    value: 45,
    joinDate: "2023-08-20",
  },
  {
    id: "PGC-49264",
    image: "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342644/avatar-40-04_x4qdcu.jpg",
    name: "Yuki Tanaka",
    status: "Inactive",
    location: "Warsaw, PL",
    verified: true,
    referral: {
      name: "Astrid Andersen",
      image:
        "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342643/avatar-40-10_qyybkj.jpg",
    },
    value: 53,
    joinDate: "2023-05-15",
  },
  {
    id: "OQZ-19348",
    image: "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342644/avatar-40-04_x4qdcu.jpg",
    name: "Mike Allison",
    status: "Inactive",
    location: "San Francisco, US",
    verified: true,
    referral: {
      name: "Lena Müller",
      image:
        "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342643/avatar-40-15_fguzbs.jpg",
    },
    value: 30,
    joinDate: "2023-04-10",
  },
  {
    id: "WTY-78045",
    image: "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342644/avatar-40-05_xli7l8.jpg",
    name: "Anna Visconti",
    status: "Active",
    location: "Rome, IT",
    verified: true,
    referral: {
      name: "Fatim Al-Sayed",
      image:
        "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342644/avatar-40-11_jtjhsp.jpg",
    },
    value: 82,
    joinDate: "2024-02-20",
  },
  {
    id: "NBQ-30871",
    image: "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342644/avatar-40-06_rhmjht.jpg",
    name: "David Kim",
    status: "Inactive",
    location: "Paris, FR",
    verified: true,
    referral: {
      name: "Olivia Brown",
      image:
        "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342644/avatar-40-14_xnyo8y.jpg",
    },
    value: 58,
    joinDate: "2023-06-15",
  },
  {
    id: "BJL-57028",
    image: "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342644/avatar-40-09_zsh2r5.jpg",
    name: "Lucia Sorna",
    status: "Inactive",
    location: "Copenhagen, DK",
    verified: true,
    referral: {
      name: "Alex Allan",
      image:
        "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342644/avatar-40-13_fyeref.jpg",
    },
    value: 73,
    joinDate: "2023-03-20",
  },
  {
    id: "XYG-09214",
    image: "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342644/avatar-40-12_plokt8.jpg",
    name: "Samuel Carteron",
    status: "Inactive",
    location: "San Francisco, US",
    verified: false,
    referral: {
      name: "Lena Müller",
      image:
        "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342643/avatar-40-15_fguzbs.jpg",
    },
    value: 40,
    joinDate: "2023-04-25",
  },
  {
    id: "TRD-64851",
    image: "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342644/avatar-40-13_fyeref.jpg",
    name: "Alex Allan",
    status: "Inactive",
    location: "São Paulo, BR",
    verified: true,
    referral: {
      name: "Hiroshi Yamamoto",
      image:
        "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342643/avatar-40-16_zn3ygb.jpg",
    },
    value: 80,
    joinDate: "2023-07-10",
  },
  {
    id: "DQE-15940",
    image: "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342644/avatar-40-14_xnyo8y.jpg",
    name: "Olivia Brown",
    status: "Inactive",
    location: "Sydney, AU",
    verified: false,
    referral: {
      name: "Olivia Brown",
      image:
        "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342644/avatar-40-14_xnyo8y.jpg",
    },
    value: 55,
    joinDate: "2023-09-15",
  },
  {
    id: "LZR-37429",
    image: "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342643/avatar-40-16_zn3ygb.jpg",
    name: "Hiroshi Yamamoto",
    status: "Active",
    location: "Osaka, JP",
    verified: true,
    referral: {
      name: "Alex Allan",
      image:
        "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342644/avatar-40-13_fyeref.jpg",
    },
    value: 89,
    joinDate: "2023-10-25",
  },
  {
    id: "GVF-29130",
    image: "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342644/avatar-40-07_c5uzfo.jpg",
    name: "Sophie Dubois",
    status: "Inactive",
    location: "Montreal, CA",
    verified: false,
    referral: {
      name: "Hiroshi Yamamoto",
      image:
        "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342643/avatar-40-16_zn3ygb.jpg",
    },
    value: 68,
    joinDate: "2023-05-20",
  },
  {
    id: "ZXP-40865",
    image: "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342644/avatar-40-07_c5uzfo.jpg",
    name: "Diego Mendoza",
    status: "Active",
    location: "Mexico City, MX",
    verified: false,
    referral: {
      name: "Lena Müller",
      image:
        "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342643/avatar-40-15_fguzbs.jpg",
    },
    value: 92,
    joinDate: "2023-08-15",
  },
  {
    id: "MNY-52034",
    image: "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342643/avatar-40-15_fguzbs.jpg",
    name: "Lena Müller",
    status: "Inactive",
    location: "Vienna, AT",
    verified: true,
    referral: {
      name: "Astrid Andersen",
      image:
        "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342643/avatar-40-10_qyybkj.jpg",
    },
    value: 37,
    joinDate: "2023-11-10",
  },
  {
    id: "JTK-30751",
    image: "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342643/avatar-40-17_vwikrz.jpg",
    name: "Raj Patel",
    status: "Inactive",
    location: "Mumbai, IN",
    verified: false,
    referral: {
      image:
        "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342644/avatar-40-04_x4qdcu.jpg",
      name: "Yuki Tanaka",
    },
    value: 47,
    joinDate: "2023-12-15",
  },
  {
    id: "FWH-68247",
    image: "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342643/avatar-40-10_qyybkj.jpg",
    name: "Astrid Andersen",
    status: "Inactive",
    location: "Oslo, NO",
    verified: true,
    referral: {
      name: "Astrid Andersen",
      image:
        "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342643/avatar-40-10_qyybkj.jpg",
    },
    value: 100,
    joinDate: "2023-06-20",
  },
  {
    id: "XCU-85036",
    image: "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342644/avatar-40-11_jtjhsp.jpg",
    name: "Fatim Al-Sayed",
    status: "Active",
    location: "Cairo, EG",
    verified: false,
    referral: {
      image:
        "https://res.cloudinary.com/dlzlfasou/image/upload/v1738342644/avatar-40-05_xli7l8.jpg",
      name: "Anna Visconti",
    },
    value: 64,
    joinDate: "2023-09-10",
  },
];

const querySchema = object({
  filter: string().label("Filter").oneOf(["active", "inactive"]).nullable(),
  search: string().label("Search").nullable(),
  page: string().label("Page").nullable(),
  pageSize: string().label("Page Size").nullable(),
});
export default defineEventHandler({
  handler: async (e) => {
    const query = await getValidatedQuery(e, (d) => querySchema.validateSync(d));

    let filteredContacts = [...contacts];

    // ✅ Filtering by status
    if (query.filter) {
      filteredContacts = filteredContacts.filter(
        (contact) => contact.status.toLowerCase() === query?.filter?.toLowerCase() || ""
      );
    }

    // ✅ Searching
    if (query.search) {
      const search = query.search.toLowerCase();
      filteredContacts = filteredContacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(search) ||
          contact.location.toLowerCase().includes(search) ||
          contact.referral.name.toLowerCase().includes(search)
      );
    }

    // ✅ Pagination
    const page = parseInt(query.page as string) || 1;
    const pageSize = parseInt(query.pageSize as string) || 10;
    const total = filteredContacts.length;
    const paginatedContacts = filteredContacts.slice((page - 1) * pageSize, page * pageSize);

    return {
      data: paginatedContacts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },
});

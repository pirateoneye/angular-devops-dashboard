export interface IndukCicilan {
    cis:  string;
    jenisnasabah: string;
    mobilePhone :string;
    outlet:  Outlet[];
    pemilikName:  string;
}


export interface Outlet {
    
    mid: string;
    midInduk: string;
    iscicilan0: boolean;
    jenisOutlet: string;
    outletName: string;
    qrisNmid: string;
    visa: string;
    master: string;
    amex: string;
    pl: string;
    cup: string;
    jcb: string;
    tenor: number;
}
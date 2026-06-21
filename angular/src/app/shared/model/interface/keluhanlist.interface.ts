export interface KeluhanList {
    requestid : string;
    callid : string;
    productid : string;
    serialid : string;
    mid : string;
    merchantname : string;
    address1 : string;
    address2 : string;
    status : string;
    permasalahan : string;
    teknisi : string;
    entrydate : string;
    entryby : string;
    duedate : string;
    notes : string;
    image_path : string;
    summary: string;
    namaMerchant : string;
    email: string;
    namaPemilik : string;
    telpPemilik: string;

    handled :{
        method : string;
        name: string;
        date: any;
        notes: string;
        isNeedFu : boolean;
    } | any
    // replied :{
    //     template : string;
    //     name: string;
    //     date: any;
    // }

}
import { environment } from 'src/environments/environment';

//Testing
export const MCB_TOOLS_FILE_SERVER_MANAGER_LIST_FILE_BY_CATEGORY = `${environment.hostToolsMcb}/v1.0.0/file/list/category/{category}`;
export const MCB_TOOLS_FILE_SERVER_MANAGER_DOWNLOAD_FILE =  `${environment.hostToolsMcb}/v1.0.0/file/download/category/{category}/file/{filename}`;
export const MCB_TOOLS_FILE_SERVER_MANAGER_WRITE_FILE =  `${environment.hostToolsMcb}/v1.0.0/file/write/category/{category}/file?audittrailUser={user}`;
export const MCB_TOOLS_FILE_SERVER_MANAGER_DELETE_FILE =  `${environment.hostToolsMcb}/v1.0.0/file/delete/category/{category}/file/{filename}?audittrailUser={user}`;
export const MCB_TOOLS_FILE_SERVER_MANAGER_LIST_CATEGORY_FILE = `${environment.hostToolsMcb}/v1.0.0/file/category`;

export const MCB_TOOLS_DATA_MANAGEMENT_GET_DATA_PENGAJUAN = `${environment.hostToolsMcb}/v1.0.0/data/pengajuan/{submissionType}/{checkBy}/{checkValue}`;
export const MCB_TOOLS_DATA_MANAGEMENT_DELETE_DATA_PENGAJUAN =  `${environment.hostToolsMcb}/v1.0.0/data/pengajuan/{submissionType}/{checkBy}/{checkValue}?audittrailUser={user}`;

//Piket
export const MESSI_GET_ACCESS_TOKEN =  `${environment.hostMessiProd}/messi.api.gateway/v1/sso/auth/realms/bca/protocol/openid-connect/token`;
export const MESSI_GET_USER_BY_EMAIL =  `${environment.hostMessiProd}/messi.api/v1/sso/f55e7b79-f6c2-41aa-bbc9-1f53788d04fd/user?email={email}`;
export const MESSI_EDIT_USER = `${environment.hostMessiProd}/messi.api/v1/sso/8877ab1e-1881-402b-9f06-62f4db8c7829/users/{userId}`;

export const MAGENTA_GET_INDUK_CICILAN =  `${environment.hostMagentaProd}/api.merchant_v2.0.0/v1.0.0/Outlet/IndukCicilan/{mid}`;
export const MAGENTA_GET_PEMILIK_BY_CIS =  `${environment.hostMagentaProd}/api.merchant_v2.0.0/v1.0.0/Pemilik/getPemilikMerchantByCis/{cis}`;
export const MAGENTA_GET_STICKER_QRIS_BY_MID =  `${environment.hostMagentaProd}/api.util_v2.0.0/outlet/nmid/image/{mid}`;
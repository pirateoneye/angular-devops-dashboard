
export interface BatchList {
    id : number;
    batch_name : string;
    title : string;
    description : string;
    feature : string[];
    icon : string;
    last_run_status : string;
    last_run_by : string;
    last_run_time_start : string;
    last_run_time_end : string;
    available_status: number;
}
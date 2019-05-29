import{timeParse} from "d3-time-format";
export const dateParse = timeParse("%Y-%m-%d");
//https://stackoverflow.com/questions/1053843/get-the-element-with-the-highest-occurrence-in-an-array
export function mode(arr){
    return arr.sort((a,b) =>
          arr.filter(v => v===a).length
        - arr.filter(v => v===b).length
    ).pop();
}

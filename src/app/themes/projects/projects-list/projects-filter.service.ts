import { Injectable } from '@angular/core';

@Injectable()
export class ProjectsFilterService {

  // get unique attributes for future filtering
  getUniqueAttribute(projects: any, name: string) {
    return this.getThemesListArray(projects, name).filter((value, i, array ) => array.indexOf(value) === i);
  }

  // get themes array
  getThemesListArray(projects: any, name: string) {
    // TODO add Observable
    // tslint:disable-next-line: radix
    return projects.map(value => value.attributes[name]).sort((a, b) => parseInt(a) - parseInt(b));
  }

  // get unique Year string array attributes with substring
  getUniqueAttributeSubStr(projects: any, name: string, index: number) {
    const yearsArr = this.getUniqueAttribute(projects, name).map(
      // do not add empty string "", which can appear if year was not defined by adding if statement and returning undefined values
      // tslint:disable-next-line: curly
      a => { if ((a !== '') && a) return a.substring(0, index)}).
            // tslint:disable-next-line: radix
            sort((a, b) => parseInt(a) - parseInt(b)).
              filter((a, i, array) => array.indexOf(a) == i ).
                filter(a => a); // finaly filter undefined values
    return yearsArr;
  }
}


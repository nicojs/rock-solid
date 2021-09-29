import { Upsertable } from './upsertable';
export interface BaseProject {
    id: number;
    projectnummer: string;
    type: ProjectType;
}
export declare enum ProjectType {
    cursus = "cursus",
    vakantie = "vakantie"
}
export interface Cursus extends BaseProject {
    type: ProjectType.cursus;
}
export declare type Project = Cursus;
export declare type UpsertableProject = Upsertable<Project, 'projectnummer' | 'type'>;

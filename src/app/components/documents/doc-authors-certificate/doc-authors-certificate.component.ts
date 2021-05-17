import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ENTER } from '@angular/cdk/keycodes';
import { Observable } from 'rxjs';
import { MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { map } from 'rxjs/operators';
import { AutocompleteService } from '@services/autocomplete.service';
import { FilesGenerationService } from '@services/files-generation.service';
import { AuthorsCertificateModel, AuthorsModel } from '@models/authors-certificate';
import { UserModel } from '@models/user';
import { AuthService } from '@services/auth.service';

@Component({
  selector: 'app-doc-authors-certificate',
  templateUrl: './doc-authors-certificate.component.html',
  styleUrls: ['./doc-authors-certificate.component.css']
})
export class DocAuthorsCertificateComponent implements OnInit {

  user: UserModel;

  authorsCertificate: AuthorsCertificateModel;
  separatorKeysCodes: number[] = [ENTER];
  elVersion = false;

  authorsFormGroup: FormGroup;
  materialsFormGroup: FormGroup;
  publishingHouseFormGroup: FormGroup;
  managerFormGroup: FormGroup;
  dateFormGroup: FormGroup;

  authorCtrl = new FormControl();
  filteredAuthors: Observable<AuthorsModel[]>;
  authors: AuthorsModel[] = []; allAuthors: AuthorsModel[] = [];

  managerCtrl = new FormControl();
  filteredManagers: Observable<AuthorsModel[]>;

  publishingHouseCtrl = new FormControl();
  filteredPublishingHouses: Observable<string[]>;
  allPublishingHouses: string[] = [];

  universityDepartmentCtrl = new FormControl();
  filteredUniversityDepartments: Observable<string[]>;
  allUniversityDepartments: string[] = [];

  @ViewChild('authorInput') authorInput: ElementRef<HTMLInputElement>;
  @ViewChild('publishingHouseInput') publishingHouseInput: ElementRef<HTMLInputElement>;
  @ViewChild('managerInput') managerInput: ElementRef<HTMLInputElement>;
  @ViewChild('universityDepartmentInput') universityDepartmentInput: ElementRef<HTMLInputElement>;

  @ViewChild('autoAuthor') matAuthorAutocomplete: MatAutocomplete;
  @ViewChild('autoManager') matManagerAutocomplete: MatAutocomplete;
  @ViewChild('autoPublishingHouse') matPublishingHouseAutocomplete: MatAutocomplete;
  @ViewChild('autoUniversityDepartment') matUniversityDepartmentAutocomplete: MatAutocomplete;

  constructor(private auth: AuthService,
              private autocomplete: AutocompleteService,
              private filesGeneration: FilesGenerationService) {
    this.filteredAuthors = this.authorCtrl.valueChanges.pipe(
      map((author: string | null) => author ? this.allAuthors.filter((a) =>
        a.fullName.toLowerCase().indexOf(author) === 0) : this.allAuthors.slice()));
    this.filteredManagers = this.managerCtrl.valueChanges.pipe(
      map((manager: string | null) => manager ? this.allAuthors.filter((a) =>
          a.fullName.toLowerCase().indexOf(manager) === 0) : this.allAuthors.slice()));
    this.filteredPublishingHouses = this.publishingHouseCtrl.valueChanges.pipe(
      map((publishingHouse: string | null) => publishingHouse ?
        this.autocomplete.filter(publishingHouse, this.allPublishingHouses) : this.allPublishingHouses.slice()));
    this.filteredUniversityDepartments = this.universityDepartmentCtrl.valueChanges.pipe(
      map((universityDepartment: string | null) => universityDepartment ?
        this.autocomplete.filter(universityDepartment, this.allUniversityDepartments) : this.allUniversityDepartments.slice()));
  }

  ngOnInit(): void {
    this.initForms();
    this.autocomplete.getAllData(this.allAuthors, this.allPublishingHouses, this.allUniversityDepartments).subscribe();
  }

  initForms(): void{
    this.authorsFormGroup = new FormGroup({
      authorCtrl: new FormControl('', [Validators.required])
    });
    this.materialsFormGroup = new FormGroup({
      titleCtrl: new FormControl('', [Validators.required]),
      numberOfPagesCtrl: new FormControl('', [Validators.required]),
      numberOfImagesCtrl: new FormControl('', [Validators.required]),
      numberOfTablesCtrl: new FormControl('', [Validators.required])
    });
    this.publishingHouseFormGroup = new FormGroup({
      publishingHouseCtrl: new FormControl('', [Validators.required])
    });
    this.managerFormGroup = new FormGroup({
      managerCtrl: new FormControl('', [Validators.required]),
      universityDepartmentCtrl: new FormControl('', [Validators.required])
    });
    this.dateFormGroup = new FormGroup({
      dateCtrl: new FormControl('', [Validators.required]),
    });
  }

  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    this.allAuthors.forEach(author => {
      if (author.fullName.toLowerCase().includes(value.toLowerCase())) {
        this.authors.push(author);
      }
    });

    if (input) {
      input.value = '';
    }
  }

  remove(author: AuthorsModel): void {
    const index = this.authors.indexOf(author);
    if (index >= 0) {
      this.authors.splice(index, 1);
    }
  }

  selected(event: MatAutocompleteSelectedEvent, dataVariation: string): void {
    switch (dataVariation) {
      case 'scientist': {
        this.authors.push(event.option.value);
        this.authorInput.nativeElement.value = '';
        break;
      }
      case 'manager': {
        this.managerInput.nativeElement.value = event.option.value;
        break;
      }
      case 'publishingHouse': {
        this.publishingHouseInput.nativeElement.value = event.option.value;
        break;
      }
      case 'universityDepartment': {
        this.universityDepartmentInput.nativeElement.value = event.option.value;
        break;
      }
      default: {
        break;
      }
    }
  }

  moveToSelectedTab(tabName: string): void {
    for (let i = 0; i < document.querySelectorAll('.mat-tab-label-content').length; i++) {
      if ((document.querySelectorAll('.mat-tab-label-content')[i] as HTMLElement).innerText === tabName)
      {
        (document.querySelectorAll('.mat-tab-label')[i] as HTMLElement).click();
      }
    }
  }

  downloadAuthorsCertificate(materialsFormGroup, dateFormGroup): void {
    this.filesGeneration.generateAuthorsCertificate(
      this.executeAuthorsCertificateData(materialsFormGroup, dateFormGroup)).subscribe(
      result => {
        this.filesGeneration.downloadFile(result,
          'NoteOfAuthors_' + this.auth.user.lastName + '_' + this.auth.user.firstName,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      });
  }

  executeAuthorsCertificateData(materialsFormGroup, dateFormGroup): AuthorsCertificateModel {
    return {
      format: 0,
      authors: this.authors,
      publishingNameWithItsStatics: 'навчального посібника «' + materialsFormGroup.titleCtrl + '», '
        + materialsFormGroup.numberOfPagesCtrl + ' сторінок, ' + materialsFormGroup.numberOfImagesCtrl
        + ' рисунків, ' + materialsFormGroup.numberOfTablesCtrl + ' таблиць, ' + this.containsElVersion(this.elVersion),
      publishingHouse: this.publishingHouseCtrl.value,
      publishingDate: dateFormGroup.dateCtrl.toISOString(),
      universityDepartmentName: this.universityDepartmentCtrl.value,
      fullNameOfChiefOfUniversityDepartment: this.managerCtrl.value
    };
  }

  containsElVersion(elVersion: boolean): string {
    if (elVersion) {
      return 'наявна електронна версія';
    } else {
      return 'відсутня електронна версія';
    }
  }
}

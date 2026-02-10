import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditStudentModalComponent } from './add-edit-student-modal.component';

describe('AddEditStudentModalComponent', () => {
  let component: AddEditStudentModalComponent;
  let fixture: ComponentFixture<AddEditStudentModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddEditStudentModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddEditStudentModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
